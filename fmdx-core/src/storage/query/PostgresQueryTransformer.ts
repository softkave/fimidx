import { sql } from "drizzle-orm";
import type {
  INumberMetaQuery,
  IObjField,
  IObjMetaQuery,
  IObjPartLogicalQuery,
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
  transformFilter(query: IObjQuery, date: Date): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    // Add appId filter
    if (query.appId) {
      conditions.push(sql`app_id = ${query.appId}`);
    }

    // Add part query filter
    if (query.partQuery) {
      const partFilter = this.transformLogicalQuery(query.partQuery, date);
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
    joinOp: "AND" | "OR" = "AND"
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];
    partQuery.forEach((part) => {
      // Build JSON path for obj_record: use -> for all but last, ->> for last for scalars, but for arrays, use -> for all
      const segments = part.field.split(".");
      // For array fields, we want the last segment to use -> (not ->>), for scalars use ->> for last
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
      function getTextValue(val: any) {
        return typeof val === "string" ? val : JSON.stringify(val);
      }

      switch (part.op) {
        case "eq":
          conditions.push(sql`${fieldExprText} = ${getTextValue(part.value)}`);
          break;
        case "neq":
          conditions.push(sql`${fieldExprText} != ${getTextValue(part.value)}`);
          break;
        case "gt": {
          if (
            typeof part.value === "number" ||
            (typeof part.value === "string" && !isNaN(Number(part.value)))
          ) {
            const numericValue =
              typeof part.value === "string" ? Number(part.value) : part.value;
            // Use a safer approach without jsonb_typeof
            conditions.push(
              sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric > ${numericValue})`
            );
          }
          break;
        }
        case "gte": {
          if (
            typeof part.value === "number" ||
            (typeof part.value === "string" && !isNaN(Number(part.value)))
          ) {
            const numericValue =
              typeof part.value === "string" ? Number(part.value) : part.value;
            conditions.push(
              sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric >= ${numericValue})`
            );
          }
          break;
        }
        case "lt": {
          if (
            typeof part.value === "number" ||
            (typeof part.value === "string" && !isNaN(Number(part.value)))
          ) {
            const numericValue =
              typeof part.value === "string" ? Number(part.value) : part.value;
            conditions.push(
              sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric < ${numericValue})`
            );
          }
          break;
        }
        case "lte": {
          if (
            typeof part.value === "number" ||
            (typeof part.value === "string" && !isNaN(Number(part.value)))
          ) {
            const numericValue =
              typeof part.value === "string" ? Number(part.value) : part.value;
            conditions.push(
              sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric <= ${numericValue})`
            );
          }
          break;
        }
        case "like": {
          const regex = part.caseSensitive ? part.value : `(?i)${part.value}`;
          conditions.push(sql`${fieldExprText} ~ ${regex}`);
          break;
        }
        case "in": {
          if (Array.isArray(part.value)) {
            if (isArrayField) {
              // For array fields, use @> operator to check if the field contains any of the values
              const jsonbPath = segments
                .map((segment) => `->'${segment}'`)
                .join("");
              const jsonbFieldExpr = sql.raw(`obj_record${jsonbPath}`);
              const valueConditions = part.value.map(
                (value) => sql`${jsonbFieldExpr} @> ${JSON.stringify([value])}`
              );
              conditions.push(sql`(${sql.join(valueConditions, sql` OR `)})`);
            } else {
              // For non-array fields, use a single IN clause
              conditions.push(
                sql`${fieldExprText} IN (${sql.join(
                  part.value.map((v) => sql`${v}`),
                  sql`, `
                )})`
              );
            }
          }
          break;
        }
        case "not_in": {
          if (Array.isArray(part.value)) {
            conditions.push(
              sql`${fieldExprText} NOT IN (${sql.join(
                part.value.map((v) => sql`${v}`),
                sql`, `
              )})`
            );
          }
          break;
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
            conditions.push(
              sql`(${fieldExprText} ~ '^[0-9]+\.?[0-9]*$' AND (${fieldExprText})::numeric BETWEEN ${minValue} AND ${maxValue})`
            );
          }
          break;
        }
        case "exists": {
          if (part.value) {
            conditions.push(sql`${fieldExpr} IS NOT NULL`);
          } else {
            conditions.push(sql`${fieldExpr} IS NULL`);
          }
          break;
        }
      }
    });
    if (conditions.length === 0) {
      return sql`TRUE`;
    }
    return sql.join(conditions, joinOp === "AND" ? sql` AND ` : sql` OR `);
  }

  protected transformLogicalQuery(
    logicalQuery: IObjPartLogicalQuery,
    date: Date
  ): ReturnType<typeof sql> {
    // If both 'and' and 'or' are present, generate ((AND ...) OR (OR ...))
    const andQuery = logicalQuery.and
      ? this.transformPartQuery(logicalQuery.and, date, "AND")
      : undefined;
    const orQuery = logicalQuery.or
      ? this.transformPartQuery(logicalQuery.or, date, "OR")
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
}
