import { sql } from "drizzle-orm";
import type {
  INumberMetaQuery,
  IObjArrayField,
  IObjField,
  IObjMetaQuery,
  IObjPartLogicalQuery,
  IObjPartQueryItem,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
  IStringMetaQuery,
  ITopLevelFieldQuery,
} from "../../definitions/obj.js";
import { BaseQueryTransformer } from "./BaseQueryTransformer.js";
import { mapFieldToDbColumn } from "./fieldMapping.js";

export class PostgresQueryTransformer extends BaseQueryTransformer<
  ReturnType<typeof sql>
> {
  transformFilter(
    query: IObjQuery,
    date: Date,
    arrayFields?: Map<string, IObjArrayField>,
    fields?: Map<string, IObjField>
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    // Add appId filter
    if (query.appId) {
      conditions.push(sql`app_id = ${query.appId}`);
    }

    // Add part query filter
    if (query.partQuery) {
      const partFilter = this.transformLogicalQuery(
        query.partQuery,
        date,
        arrayFields,
        fields
      );
      conditions.push(partFilter);
    }

    // Add meta query filter
    if (query.metaQuery) {
      const metaFilter = this.transformMetaQuery(query.metaQuery, date);
      conditions.push(metaFilter);
    }

    // Add top-level fields filter
    if (query.topLevelFields) {
      const topLevelFilter = this.transformTopLevelFields(
        query.topLevelFields,
        date
      );
      conditions.push(topLevelFilter);
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  transformSort(
    sort: IObjSortList,
    fields?: IObjField[]
  ): ReturnType<typeof sql> {
    if (sort.length === 0) {
      return sql`created_at DESC`;
    }

    const sortClauses: ReturnType<typeof sql>[] = [];

    sort.forEach((sortItem) => {
      let direction = "DESC";
      if (sortItem.direction === "asc" || sortItem.direction === "desc") {
        direction = sortItem.direction.toUpperCase();
      }

      // Handle JSONB field paths (e.g., objRecord.order)
      if (sortItem.field.startsWith("objRecord.")) {
        const fieldPath = sortItem.field.replace(/^objRecord\./, "");

        // Check if field exists in fields array
        if (fields) {
          const fieldInfo = fields.find((f) => f.field === fieldPath);
          if (!fieldInfo) {
            // Skip this sort field if not found in fields array
            return;
          }
        }

        const segments = fieldPath.split(".");
        if (segments.length === 1) {
          // Single segment: obj_record->>'field'
          const fieldInfo = fields?.find((f) => f.field === fieldPath);
          if (fieldInfo) {
            if (fieldInfo.valueTypes.includes("number")) {
              // For numeric fields, cast to numeric for proper sorting
              sortClauses.push(
                sql.raw(`(obj_record->>'${segments[0]}')::numeric ${direction}`)
              );
            } else if (fieldInfo.valueTypes.includes("string")) {
              // For string fields, use text sorting
              sortClauses.push(
                sql.raw(`obj_record->>'${segments[0]}' ${direction}`)
              );
            }
          }
        } else {
          // Nested: obj_record#>>'{a,b,c}'
          const fieldInfo = fields?.find((f) => f.field === fieldPath);
          if (fieldInfo) {
            if (fieldInfo.valueTypes.includes("number")) {
              // For numeric fields, cast to numeric for proper sorting
              sortClauses.push(
                sql.raw(
                  `(obj_record#>>'{${segments.join(
                    ","
                  )}}')::numeric ${direction}`
                )
              );
            } else if (fieldInfo.valueTypes.includes("string")) {
              // For string fields, use text sorting
              sortClauses.push(
                sql.raw(`obj_record#>>'{${segments.join(",")}}' ${direction}`)
              );
            }
          }
        }
      } else if (sortItem.field.includes(".")) {
        // Fallback for other dotted fields
        const fieldPath = sortItem.field;

        // Check if field exists in fields array
        if (fields) {
          const fieldInfo = fields.find((f) => f.field === fieldPath);
          if (!fieldInfo) {
            // Skip this sort field if not found in fields array
            return;
          }
        }

        const fieldInfo = fields?.find((f) => f.field === fieldPath);
        if (fieldInfo) {
          if (fieldInfo.valueTypes.includes("number")) {
            // For numeric fields, cast to numeric for proper sorting
            sortClauses.push(
              sql.raw(
                `(obj_record#>>'{${fieldPath
                  .split(".")
                  .join(",")}}')::numeric ${direction}`
              )
            );
          } else if (fieldInfo.valueTypes.includes("string")) {
            // For string fields, use text sorting
            sortClauses.push(
              sql.raw(
                `obj_record#>>'{${fieldPath
                  .split(".")
                  .join(",")}}' ${direction}`
              )
            );
          }
        }
      } else {
        // Direct column reference - convert camelCase to snake_case
        const dbColumn = mapFieldToDbColumn(sortItem.field);
        sortClauses.push(
          sql`${sql.identifier(dbColumn)} ${sql.raw(direction)}`
        );
      }
    });

    // If no valid sort clauses, return default
    if (sortClauses.length === 0) {
      return sql`created_at DESC`;
    }

    // Join multiple sort clauses
    if (sortClauses.length === 1) {
      return sortClauses[0];
    } else {
      // For multiple clauses, we need to join them properly
      let result = sortClauses[0];
      for (let i = 1; i < sortClauses.length; i++) {
        result = sql`${result}, ${sortClauses[i]}`;
      }
      return result;
    }
  }

  transformPagination(page: number, limit: number): ReturnType<typeof sql> {
    return sql`OFFSET ${page * limit} LIMIT ${limit}`;
  }

  protected transformPartQuery(
    partQuery: IObjPartQueryList,
    date: Date,
    joinOp: "AND" | "OR" = "AND",
    arrayFields?: Map<string, IObjArrayField>,
    fields?: Map<string, IObjField>
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];
    const hasFalseCondition = { value: false };
    const hasTrueCondition = { value: false };

    partQuery.forEach((part) => {
      // Check if this field involves array access
      const partArrayFields = this.findArrayField(part.field, arrayFields);
      if (partArrayFields && partArrayFields.size > 0) {
        // Hybrid: both array and scalar at this path
        const hybridCondition = this.generateHybridArrayQuery(
          part,
          partArrayFields
        );
        conditions.push(hybridCondition);
      }
      //  else if (arrayField) {
      //   // Generate PostgreSQL array query
      //   const arrayCondition = this.generateArrayQuery(part, arrayField);
      //   conditions.push(arrayCondition);
      // }
      else {
        // Fall back to regular JSONB query
        const regularCondition = this.generateRegularQuery(part);
        conditions.push(regularCondition);
      }
    });

    if (hasFalseCondition.value) {
      return sql`FALSE`;
    }

    if (hasTrueCondition.value) {
      return sql`TRUE`;
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return joinOp === "AND"
      ? sql.join(conditions, sql` AND `)
      : sql.join(conditions, sql` OR `);
  }

  protected transformLogicalQuery(
    logicalQuery: IObjPartLogicalQuery,
    date: Date,
    arrayFields?: Map<string, IObjArrayField>,
    fields?: Map<string, IObjField>
  ): ReturnType<typeof sql> {
    // If both 'and' and 'or' are present, generate ((AND ...) OR (OR ...))
    const andQuery = logicalQuery.and
      ? this.transformPartQuery(
          logicalQuery.and,
          date,
          "AND",
          arrayFields,
          fields
        )
      : undefined;
    const orQuery = logicalQuery.or
      ? this.transformPartQuery(
          logicalQuery.or,
          date,
          "OR",
          arrayFields,
          fields
        )
      : undefined;

    if (andQuery && orQuery) {
      return sql`((${andQuery}) OR (${orQuery}))`;
    } else if (andQuery) {
      return andQuery;
    } else if (orQuery) {
      return orQuery;
    } else {
      return sql`TRUE`;
    }
  }

  protected transformMetaQuery(
    metaQuery: IObjMetaQuery,
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];
    Object.entries(metaQuery).forEach(([key, value]) => {
      const dbKey = mapFieldToDbColumn(key);
      if (this.isStringMetaQuery(value)) {
        const stringCondition = this.transformStringMetaQuery(dbKey, value);
        conditions.push(stringCondition);
      } else if (this.isNumberMetaQuery(value)) {
        // If the key is a date column, convert value to ISO string
        if (["created_at", "updated_at"].includes(dbKey)) {
          const numberCondition = this.transformNumberMetaQuery(
            dbKey,
            value,
            date,
            true
          );
          conditions.push(numberCondition);
        } else {
          const numberCondition = this.transformNumberMetaQuery(
            dbKey,
            value,
            date
          );
          conditions.push(numberCondition);
        }
      }
    });
    if (conditions.length === 0) {
      return sql`TRUE`;
    }
    return sql.join(conditions, sql` AND `);
  }

  protected transformTopLevelFields(
    topLevelFields: ITopLevelFieldQuery,
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    // Handle shouldIndex (boolean field)
    if (topLevelFields.shouldIndex !== undefined) {
      conditions.push(
        sql`${sql.identifier(mapFieldToDbColumn("shouldIndex"))} = ${
          topLevelFields.shouldIndex
        }`
      );
    }

    // Handle fieldsToIndex (array field)
    if (topLevelFields.fieldsToIndex !== undefined) {
      conditions.push(
        sql`${sql.identifier(
          mapFieldToDbColumn("fieldsToIndex")
        )} = ${JSON.stringify(topLevelFields.fieldsToIndex)}`
      );
    }

    // Handle tag (string meta query)
    if (topLevelFields.tag) {
      const tagCondition = this.transformStringMetaQuery(
        mapFieldToDbColumn("tag"),
        topLevelFields.tag
      );
      conditions.push(tagCondition);
    }

    // Handle groupId (string meta query)
    if (topLevelFields.groupId) {
      const groupIdCondition = this.transformStringMetaQuery(
        mapFieldToDbColumn("groupId"),
        topLevelFields.groupId
      );
      conditions.push(groupIdCondition);
    }

    // Handle deletedAt (null or number meta query)
    if (topLevelFields.deletedAt !== undefined) {
      if (topLevelFields.deletedAt === null) {
        conditions.push(
          sql`${sql.identifier(mapFieldToDbColumn("deletedAt"))} IS NULL`
        );
      } else {
        const deletedAtCondition = this.transformNumberMetaQuery(
          mapFieldToDbColumn("deletedAt"),
          topLevelFields.deletedAt,
          date
        );
        conditions.push(deletedAtCondition);
      }
    }

    // Handle deletedBy (string meta query)
    if (topLevelFields.deletedBy) {
      const deletedByCondition = this.transformStringMetaQuery(
        mapFieldToDbColumn("deletedBy"),
        topLevelFields.deletedBy
      );
      conditions.push(deletedByCondition);
    }

    // Handle deletedByType (string meta query)
    if (topLevelFields.deletedByType) {
      const deletedByTypeCondition = this.transformStringMetaQuery(
        mapFieldToDbColumn("deletedByType"),
        topLevelFields.deletedByType
      );
      conditions.push(deletedByTypeCondition);
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  private isStringMetaQuery(value: any): value is IStringMetaQuery {
    return (
      value &&
      (value.eq !== undefined ||
        value.neq !== undefined ||
        value.in !== undefined ||
        value.not_in !== undefined)
    );
  }

  private isNumberMetaQuery(value: any): value is INumberMetaQuery {
    return (
      value &&
      (value.eq !== undefined ||
        value.neq !== undefined ||
        value.in !== undefined ||
        value.not_in !== undefined ||
        value.gt !== undefined ||
        value.gte !== undefined ||
        value.lt !== undefined ||
        value.lte !== undefined ||
        value.between !== undefined)
    );
  }

  private transformStringMetaQuery(
    key: string,
    value: IStringMetaQuery
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    if (value.eq !== undefined) {
      conditions.push(sql`${sql.identifier(key)} = ${value.eq}`);
    }
    if (value.neq !== undefined) {
      conditions.push(sql`${sql.identifier(key)} != ${value.neq}`);
    }
    if (value.in !== undefined && value.in.length > 0) {
      conditions.push(
        sql`${sql.identifier(key)} IN (${sql.join(
          value.in.map((v) => sql`${v}`),
          sql`, `
        )})`
      );
    }
    if (value.not_in !== undefined && value.not_in.length > 0) {
      conditions.push(
        sql`${sql.identifier(key)} NOT IN (${sql.join(
          value.not_in.map((v) => sql`${v}`),
          sql`, `
        )})`
      );
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  private transformNumberMetaQuery(
    key: string,
    value: INumberMetaQuery,
    date: Date,
    forceString: boolean = false
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    const getValue = (v: any) =>
      forceString
        ? v instanceof Date
          ? v.toISOString()
          : typeof v === "number"
          ? v > 1e12
            ? new Date(v).toISOString()
            : new Date(v * 1000).toISOString()
          : typeof v === "string" && !isNaN(Date.parse(v))
          ? new Date(v).toISOString()
          : v
        : this.getNumberOrDurationMsFromValue(v).valueNumber;

    if (value.eq !== undefined) {
      const eqValue = getValue(value.eq);
      if (eqValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} = ${eqValue}`);
      }
    }
    if (value.neq !== undefined) {
      const neqValue = getValue(value.neq);
      if (neqValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} != ${neqValue}`);
      }
    }
    if (value.in !== undefined && value.in.length > 0) {
      const inValues = value.in
        .map((v) => getValue(v))
        .filter((v) => v !== undefined);
      if (inValues.length > 0) {
        conditions.push(
          sql`${sql.identifier(key)} IN (${sql.join(
            inValues.map((v) => sql`${v}`),
            sql`, `
          )})`
        );
      }
    }
    if (value.not_in !== undefined && value.not_in.length > 0) {
      const notInValues = value.not_in
        .map((v) => getValue(v))
        .filter((v) => v !== undefined);
      if (notInValues.length > 0) {
        conditions.push(
          sql`${sql.identifier(key)} NOT IN (${sql.join(
            notInValues.map((v) => sql`${v}`),
            sql`, `
          )})`
        );
      }
    }
    if (value.gt !== undefined) {
      const gtValue = getValue(value.gt);
      if (gtValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} > ${gtValue}`);
      }
    }
    if (value.gte !== undefined) {
      const gteValue = getValue(value.gte);
      if (gteValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} >= ${gteValue}`);
      }
    }
    if (value.lt !== undefined) {
      const ltValue = getValue(value.lt);
      if (ltValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} < ${ltValue}`);
      }
    }
    if (value.lte !== undefined) {
      const lteValue = getValue(value.lte);
      if (lteValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} <= ${lteValue}`);
      }
    }
    if (value.between !== undefined) {
      const [min, max] =
        (Array.isArray(value.between) ? value.between.map(getValue) : []) || [];
      if (min !== undefined && max !== undefined) {
        conditions.push(sql`${sql.identifier(key)} BETWEEN ${min} AND ${max}`);
      }
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  private findArrayField(
    field: string,
    arrayFields?: Map<string, IObjArrayField>
  ): Map<string, IObjArrayField> | undefined {
    if (!arrayFields) return undefined;

    const segments = field.split(".");
    const foundFields: Map<string, IObjArrayField> = new Map();

    // Check if any parent path is an array field
    for (let i = 1; i <= segments.length; i++) {
      const parentPath = segments.slice(0, i).join(".");
      const arrayField = arrayFields.get(parentPath);
      if (arrayField) {
        foundFields.set(parentPath, arrayField);
      }
    }

    return foundFields;
  }

  private generateArrayQuery(
    part: IObjPartQueryItem,
    arrayField: IObjArrayField
  ): ReturnType<typeof sql> {
    const segments = part.field.split(".");
    const arrayFieldPath = arrayField.field; // e.g., 'logsQuery.and'
    const arrayFieldSegments = arrayFieldPath.split(".");

    // Find the part after the array field
    const remainingPathArr = segments.slice(arrayFieldSegments.length);
    const remainingPath = remainingPathArr.join(".");
    const remainingPathComma = remainingPathArr.join(",");

    // Helper to get the correct value for text comparison
    const getTextValue = (val: any) => {
      return typeof val === "string" ? val : JSON.stringify(val);
    };

    // If remainingPath is empty, this is an array of primitives
    // If arrayFieldSegments.length < segments.length but remainingPath is empty, fallback to regular query (mixed array/scalar)
    if (remainingPath === "" && arrayFieldSegments.length < segments.length) {
      // Fallback to regular query
      return this.generateRegularQuery(part);
    }

    // Build the JSON path for the array field - use proper SQL template literals
    let arrayFieldPathExpr;
    if (arrayFieldSegments.length === 1) {
      arrayFieldPathExpr = sql`obj_record->${arrayFieldSegments[0]}`;
    } else {
      // For nested paths, we need to construct the path properly
      const pathString = `{${arrayFieldSegments.join(",")}}`;
      arrayFieldPathExpr = sql.raw(`obj_record#> '${pathString}'`);
    }

    // Add non-empty array check for pure array fields
    const arrayTypeCheck = sql`jsonb_typeof(${arrayFieldPathExpr}) = 'array'`;
    const arrayNonEmptyCheck = sql`jsonb_array_length(${arrayFieldPathExpr}) > 0`;

    // Build the field accessor for the remaining path
    let fieldAccessor: any;
    let isPrimitive = false;
    if (remainingPath === "") {
      // Array of primitives
      fieldAccessor = sql`arr_elem::text`;
      isPrimitive = true;
    } else if (remainingPathArr.length > 1) {
      // Nested path: arr_elem #>> '{a,b,c}'
      const pathString = `{${remainingPathComma}}`;
      fieldAccessor = sql.raw(`arr_elem #>> '${pathString}'`);
    } else {
      // Single field: arr_elem->>'field'
      fieldAccessor = sql`arr_elem->>${remainingPath}`;
    }

    // Helper to combine with non-empty array check
    function withArrayCheck(expr: any) {
      return sql`(${arrayTypeCheck} AND ${arrayNonEmptyCheck} AND ${expr})`;
    }

    switch (part.op) {
      case "eq":
        return withArrayCheck(sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
          WHERE ${fieldAccessor} = ${
          isPrimitive ? JSON.stringify(part.value) : getTextValue(part.value)
        }
        )`);
      case "neq":
        return withArrayCheck(sql`NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
          WHERE ${fieldAccessor} = ${
          isPrimitive ? JSON.stringify(part.value) : getTextValue(part.value)
        }
        )`);
      case "in":
        if (Array.isArray(part.value)) {
          if (part.value.length === 0) {
            return sql`FALSE`;
          }
          if (isPrimitive) {
            // Use arr_elem::text = ANY(ARRAY['...'])
            const arrayValues = part.value.map((v) => JSON.stringify(v));
            return withArrayCheck(sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
              WHERE arr_elem::text = ANY(ARRAY[${sql.raw(
                arrayValues.map((v) => `'${v}'`).join(",")
              )}])
            )`);
          } else {
            const arrayValues = part.value.map((v) => getTextValue(v));
            return withArrayCheck(sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
              WHERE ${fieldAccessor} = ANY(${sql.raw(
              `ARRAY[${arrayValues.map((v) => `'${v}'`).join(",")}]`
            )})
            )`);
          }
        }
        return sql`FALSE`;
      case "not_in":
        if (Array.isArray(part.value)) {
          if (part.value.length === 0) {
            return sql`TRUE`;
          }
          if (isPrimitive) {
            // Use arr_elem::text = ANY(ARRAY['...'])
            const arrayValues = part.value.map((v) => JSON.stringify(v));
            return withArrayCheck(sql`NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
              WHERE arr_elem::text = ANY(ARRAY[${sql.raw(
                arrayValues.map((v) => `'${v}'`).join(",")
              )}])
            )`);
          } else {
            const arrayValues = part.value.map((v) => getTextValue(v));
            return withArrayCheck(sql`NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
              WHERE ${fieldAccessor} = ANY(${sql.raw(
              `ARRAY[${arrayValues.map((v) => `'${v}'`).join(",")}]`
            )})
            )`);
          }
        }
        return sql`TRUE`;
      case "like": {
        const regex = part.caseSensitive ? part.value : `(?i)${part.value}`;
        return withArrayCheck(sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
          WHERE ${fieldAccessor} ~ ${regex}
        )`);
      }
      case "exists":
        return withArrayCheck(sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
          WHERE ${fieldAccessor} IS ${part.value ? sql`NOT NULL` : sql`NULL`}
        )`);
      case "between": {
        const [min, max] = part.value;
        if (typeof min === "number" && typeof max === "number") {
          return withArrayCheck(sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
            WHERE (${fieldAccessor})::numeric >= ${min} AND (${fieldAccessor})::numeric <= ${max}
          )`);
        }
        return sql`FALSE`;
      }
      default:
        // For numeric operations, we need to handle type casting
        if (["gt", "gte", "lt", "lte"].includes(part.op)) {
          let numericValue: number;
          if (typeof part.value === "string") {
            numericValue = Number(part.value);
          } else if (typeof part.value === "number") {
            numericValue = part.value;
          } else {
            // Handle duration objects or other complex types
            return sql`FALSE`;
          }

          if (isNaN(numericValue)) {
            return sql`FALSE`;
          }

          const operator =
            part.op === "gt"
              ? ">"
              : part.op === "gte"
              ? ">="
              : part.op === "lt"
              ? "<"
              : part.op === "lte"
              ? "<="
              : "=";

          return withArrayCheck(sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${arrayFieldPathExpr}) AS arr_elem
            WHERE (${fieldAccessor})::numeric ${sql.raw(
            operator
          )} ${numericValue}
          )`);
        }

        // Fallback to regular query for unsupported operations
        return this.generateRegularQuery(part);
    }
  }

  private generateRegularQuery(
    part: IObjPartQueryItem
  ): ReturnType<typeof sql> {
    // Build JSON path for obj_record: use -> for all but last, ->> for last for scalars
    const segments = part.field.split(".");
    const isArrayField =
      segments[segments.length - 1].toLowerCase().includes("tag") ||
      segments[segments.length - 1].toLowerCase().includes("array") ||
      segments[segments.length - 1].toLowerCase().includes("list");

    let fieldExpr;
    let fieldExprText;

    if (segments.length === 1) {
      // Single segment: obj_record->>'field'
      fieldExpr = sql.raw(`obj_record->>'${segments[0]}'`);
      fieldExprText = fieldExpr;
    } else if (isArrayField) {
      // Array field: obj_record#>'{a,b,c}'
      fieldExpr = sql.raw(`obj_record#>'{${segments.join(",")}}'`);
      fieldExprText = fieldExpr;
    } else {
      // Nested scalar: obj_record#>>'{a,b,c}'
      fieldExpr = sql.raw(`obj_record#>>'{${segments.join(",")}}'`);
      fieldExprText = fieldExpr;
    }

    // Helper to get the correct value for text comparison
    const getTextValue = (val: any) => {
      return typeof val === "string" ? val : JSON.stringify(val);
    };

    switch (part.op) {
      case "eq":
        return sql`${fieldExprText} = ${getTextValue(part.value)}`;
      case "neq":
        return sql`${fieldExprText} != ${getTextValue(part.value)}`;
      case "gt": {
        if (
          typeof part.value === "number" ||
          (typeof part.value === "string" && !isNaN(Number(part.value)))
        ) {
          const numericValue =
            typeof part.value === "string" ? Number(part.value) : part.value;
          return sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric > ${numericValue})`;
        }
        return sql`FALSE`;
      }
      case "gte": {
        if (
          typeof part.value === "number" ||
          (typeof part.value === "string" && !isNaN(Number(part.value)))
        ) {
          const numericValue =
            typeof part.value === "string" ? Number(part.value) : part.value;
          return sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric >= ${numericValue})`;
        }
        return sql`FALSE`;
      }
      case "lt": {
        if (
          typeof part.value === "number" ||
          (typeof part.value === "string" && !isNaN(Number(part.value)))
        ) {
          const numericValue =
            typeof part.value === "string" ? Number(part.value) : part.value;
          return sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric < ${numericValue})`;
        }
        return sql`FALSE`;
      }
      case "lte": {
        if (
          typeof part.value === "number" ||
          (typeof part.value === "string" && !isNaN(Number(part.value)))
        ) {
          const numericValue =
            typeof part.value === "string" ? Number(part.value) : part.value;
          return sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric <= ${numericValue})`;
        }
        return sql`FALSE`;
      }
      case "like": {
        const regex = part.caseSensitive ? part.value : `(?i)${part.value}`;
        return sql`${fieldExprText} ~ ${regex}`;
      }
      case "in": {
        if (Array.isArray(part.value)) {
          if (part.value.length === 0) {
            return sql`FALSE`;
          } else if (isArrayField) {
            // For array fields, use @> operator to check if the field contains any of the values
            const jsonbPath = segments
              .map((segment: string) => `->'${segment}'`)
              .join("");
            const jsonbFieldExpr = sql.raw(`obj_record${jsonbPath}`);
            const valueConditions = part.value.map(
              (value: any) =>
                sql`${jsonbFieldExpr} @> ${JSON.stringify([value])}`
            );
            return sql`(${sql.join(valueConditions, sql` OR `)})`;
          } else {
            // For non-array fields, use a single IN clause
            return sql`${fieldExprText} IN (${sql.join(
              part.value.map((v: any) => sql`${v}`),
              sql`, `
            )})`;
          }
        }
        return sql`FALSE`;
      }
      case "not_in": {
        if (Array.isArray(part.value)) {
          if (part.value.length === 0) {
            return sql`TRUE`;
          }
          return sql`${fieldExprText} NOT IN (${sql.join(
            part.value.map((v: any) => sql`${v}`),
            sql`, `
          )})`;
        }
        return sql`TRUE`;
      }
      case "between": {
        if (
          Array.isArray(part.value) &&
          part.value.length === 2 &&
          (typeof part.value[0] === "number" ||
            (typeof part.value[0] === "string" &&
              !isNaN(Number(part.value[0])))) &&
          (typeof part.value[1] === "number" ||
            (typeof part.value[1] === "string" &&
              !isNaN(Number(part.value[1]))))
        ) {
          const minValue =
            typeof part.value[0] === "string"
              ? Number(part.value[0])
              : part.value[0];
          const maxValue =
            typeof part.value[1] === "string"
              ? Number(part.value[1])
              : part.value[1];
          return sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric BETWEEN ${minValue} AND ${maxValue})`;
        }
        return sql`FALSE`;
      }
      case "exists": {
        return part.value
          ? sql`${fieldExpr} IS NOT NULL`
          : sql`${fieldExpr} IS NULL`;
      }
      default:
        return sql`FALSE`;
    }
  }

  /**
   * Hybrid array/scalar query using jsonb_path_exists for mixed paths (supports nested arrays)
   */
  private generateHybridArrayQuery(
    part: IObjPartQueryItem,
    arrayFields: Map<string, IObjArrayField>
  ): ReturnType<typeof sql> {
    const segments = part.field.split(".");
    // Generate all possible JSONPath expressions with arrays at any segment
    const allPaths = this.generateAllHybridJsonPaths(segments);
    let opExpr = "";
    const value = part.value;

    // Helper to add non-empty array check for array paths
    function wrapWithArrayCheck(path: string, expr: string) {
      // If the path contains [*], add a non-empty array check for the array segment
      const arrayMatch = path.match(/\$\.(.+?)\[\*\]/);
      console.log("arrayMatch", arrayMatch);
      console.log("path", path);
      console.log("expr", expr);
      if (arrayMatch) {
        // Extract the array segment (e.g., $.arr[*].field -> arr)
        const arrayPath = arrayMatch[1];
        // Compose the jsonb_array_length check for this array segment
        // Use Postgres JSON path: obj_record->'arr' (for nested, split by dot)
        const arraySegments = arrayPath.split(".");
        let arrayExpr = "obj_record";
        for (const seg of arraySegments) {
          arrayExpr += `->'${seg}'`;
        }
        // Combine the array non-empty check and the jsonb_path_exists, and wrap in parentheses for precedence
        return `(jsonb_typeof(${arrayExpr}) = 'array' AND jsonb_array_length(${arrayExpr}) > 0 AND jsonb_path_exists(obj_record, '${expr}'))`;
      } else {
        // No array, this is a scalar path - only match if the field is NOT an array
        // Extract the field path (e.g., $.reportsTo.userId -> reportsTo)
        const fieldPath = path.replace(/^\$\./, "");
        const fieldSegments = fieldPath.split(".");
        const firstSegment = fieldSegments[0]; // e.g., "reportsTo"

        // Only include scalar path if the field is not an array
        return `(jsonb_typeof(obj_record->'${firstSegment}') != 'array' AND jsonb_path_exists(obj_record, '${expr}'))`;
      }
    }

    switch (part.op) {
      case "eq":
        opExpr = allPaths
          .map((p) => wrapWithArrayCheck(p, `${p} == \"${value}\"`))
          .join(" OR ");
        break;
      case "in":
        if (Array.isArray(value)) {
          opExpr = value
            .map((v) =>
              allPaths
                .map((p) => wrapWithArrayCheck(p, `${p} == \"${v}\"`))
                .join(" OR ")
            )
            .join(" OR ");
        }
        break;
      case "like":
        opExpr = allPaths
          .map((p) =>
            wrapWithArrayCheck(p, `${p} like_regex \"${value}\" flag \"i\"`)
          )
          .join(" OR ");
        break;
      case "exists":
        if (value) {
          opExpr = allPaths
            .map((p) => wrapWithArrayCheck(p, `exists(${p})`))
            .join(" OR ");
        } else {
          opExpr = allPaths
            .map((p) => wrapWithArrayCheck(p, `!exists(${p})`))
            .join(" AND ");
        }
        break;
      default:
        // fallback to eq
        opExpr = allPaths
          .map((p) => wrapWithArrayCheck(p, `${p} == \"${value}\"`))
          .join(" OR ");
    }
    // Wrap the whole opExpr in parentheses for safety
    return sql.raw(`(${opExpr})`);
  }

  /**
   * Generate all possible JSONPath expressions with arrays at any segment
   * E.g. [a, b, c] => ['$.a.b.c', '$.a[*].b.c', '$.a.b[*].c', '$.a[*].b[*].c']
   */
  private generateAllHybridJsonPaths(segments: string[]): string[] {
    const n = segments.length;
    const results: string[] = [];
    // There are 2^(n-1) ways to insert [*] after each segment (except last)
    const max = 1 << (n - 1);
    for (let mask = 0; mask < max; mask++) {
      let path = "$";
      for (let i = 0; i < n; i++) {
        path += "." + segments[i];
        if (i < n - 1 && mask & (1 << i)) {
          path += "[*]";
        }
      }
      results.push(path);
    }
    return results;
  }
}
