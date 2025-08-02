import { sql } from "drizzle-orm";
import type {
  INumberMetaQuery,
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
          const fieldInfo = fields.find((f) => f.path === fieldPath);
          if (!fieldInfo) {
            // Skip this sort field if not found in fields array
            return;
          }
        }

        const segments = fieldPath.split(".");
        if (segments.length === 1) {
          // Single segment: obj_record->>'field'
          const fieldInfo = fields?.find((f) => f.path === fieldPath);
          if (fieldInfo) {
            if (fieldInfo.type === "number") {
              // For numeric fields, cast to numeric for proper sorting
              sortClauses.push(
                sql.raw(`(obj_record->>'${segments[0]}')::numeric ${direction}`)
              );
            } else if (fieldInfo.type === "string") {
              // For string fields, use text sorting
              sortClauses.push(
                sql.raw(`obj_record->>'${segments[0]}' ${direction}`)
              );
            }
          }
        } else {
          // Nested: obj_record#>>'{a,b,c}'
          const fieldInfo = fields?.find((f) => f.path === fieldPath);
          if (fieldInfo) {
            if (fieldInfo.type === "number") {
              // For numeric fields, cast to numeric for proper sorting
              sortClauses.push(
                sql.raw(
                  `(obj_record#>>'{${segments.join(
                    ","
                  )}}')::numeric ${direction}`
                )
              );
            } else if (fieldInfo.type === "string") {
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
          const fieldInfo = fields.find((f) => f.path === fieldPath);
          if (!fieldInfo) {
            // Skip this sort field if not found in fields array
            return;
          }
        }

        const fieldInfo = fields?.find((f) => f.path === fieldPath);
        if (fieldInfo) {
          if (fieldInfo.type === "number") {
            // For numeric fields, cast to numeric for proper sorting
            sortClauses.push(
              sql.raw(
                `(obj_record#>>'{${fieldPath
                  .split(".")
                  .join(",")}}')::numeric ${direction}`
              )
            );
          } else if (fieldInfo.type === "string") {
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
    fields?: Map<string, IObjField>
  ): ReturnType<typeof sql> {
    if (partQuery.length === 0) {
      return sql`TRUE`;
    }

    const conditions: ReturnType<typeof sql>[] = [];

    partQuery.forEach((part) => {
      const fieldInfo = fields?.get(part.field);
      const condition = this.generateQueryCondition(part, fieldInfo, date);
      if (condition) {
        conditions.push(condition);
      }
    });

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
    fields?: Map<string, IObjField>
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    if (logicalQuery.and) {
      const andCondition = this.transformPartQuery(
        logicalQuery.and,
        date,
        "AND",
        fields
      );
      conditions.push(andCondition);
    }

    if (logicalQuery.or) {
      const orCondition = this.transformPartQuery(
        logicalQuery.or,
        date,
        "OR",
        fields
      );
      conditions.push(orCondition);
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    // When both AND and OR are present, we want: (AND conditions) OR (OR conditions)
    return sql.join(conditions, sql` OR `);
  }

  protected transformMetaQuery(
    metaQuery: IObjMetaQuery,
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    Object.entries(metaQuery).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        if (this.isStringMetaQuery(value)) {
          const condition = this.transformStringMetaQuery(key, value);
          if (condition) conditions.push(condition);
        } else if (this.isNumberMetaQuery(value)) {
          const condition = this.transformNumberMetaQuery(key, value, date);
          if (condition) conditions.push(condition);
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

    Object.entries(topLevelFields).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        if (this.isStringMetaQuery(value)) {
          const condition = this.transformStringMetaQuery(key, value);
          if (condition) conditions.push(condition);
        } else if (this.isNumberMetaQuery(value)) {
          const condition = this.transformNumberMetaQuery(key, value, date);
          if (condition) conditions.push(condition);
        }
      }
    });

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  private generateQueryCondition(
    part: IObjPartQueryItem,
    fieldInfo: IObjField | undefined,
    date: Date
  ): ReturnType<typeof sql> | null {
    const fieldPath = part.field;

    // If field is not indexed, we need to generate a dynamic query
    if (!fieldInfo) {
      return this.generateDynamicQuery(part, date);
    }

    // Handle array-compressed fields
    if (fieldInfo.isArrayCompressed) {
      return this.generateArrayCompressedQuery(part, fieldInfo, date);
    }

    // Handle regular fields
    return this.generateRegularFieldQuery(part, fieldInfo, date);
  }

  private generateDynamicQuery(
    part: IObjPartQueryItem,
    date: Date
  ): ReturnType<typeof sql> {
    const fieldPath = part.field;
    const segments = fieldPath.split(".");

    // Check if this is an array-compressed field (contains [*])
    if (fieldPath.includes("[*]")) {
      return this.generateDynamicArrayQuery(part, date);
    }

    // Generate JSONB path for regular field
    const jsonPath =
      segments.length === 1
        ? `obj_record->>'${segments[0]}'`
        : `obj_record#>>'{${segments.join(",")}}'`;

    return this.buildComparisonQuery(part, jsonPath, date);
  }

  private generateDynamicArrayQuery(
    part: IObjPartQueryItem,
    date: Date
  ): ReturnType<typeof sql> {
    const fieldPath = part.field;

    // Replace [*] with array access pattern
    const arrayPath = fieldPath.replace(/\.\[\*\]/g, "");
    const segments = arrayPath.split(".");

    // Generate JSONB array query
    const jsonPath =
      segments.length === 1
        ? `obj_record->'${segments[0]}'`
        : `obj_record#>'${segments.join(",")}'`;

    return this.buildArrayComparisonQuery(part, jsonPath, date);
  }

  private generateArrayCompressedQuery(
    part: IObjPartQueryItem,
    fieldInfo: IObjField,
    date: Date
  ): ReturnType<typeof sql> {
    const fieldPath = part.field;

    // Remove [*] for the base path
    const basePath = fieldPath.replace(/\.\[\*\]/g, "");
    const segments = basePath.split(".");

    // Generate JSONB array query
    const jsonPath =
      segments.length === 1
        ? `obj_record->'${segments[0]}'`
        : `obj_record#>'${segments.join(",")}'`;

    return this.buildArrayComparisonQuery(part, jsonPath, date);
  }

  private generateRegularFieldQuery(
    part: IObjPartQueryItem,
    fieldInfo: IObjField,
    date: Date
  ): ReturnType<typeof sql> {
    const fieldPath = part.field;
    const segments = fieldPath.split(".");

    // Generate JSONB path
    const jsonPath =
      segments.length === 1
        ? `obj_record->>'${segments[0]}'`
        : `obj_record#>>'{${segments.join(",")}}'`;

    return this.buildComparisonQuery(part, jsonPath, date);
  }

  private buildComparisonQuery(
    part: IObjPartQueryItem,
    jsonPath: string,
    date: Date
  ): ReturnType<typeof sql> {
    const { op, value } = part;

    switch (op) {
      case "eq":
        return sql.raw(`${jsonPath} = ${this.escapeValue(value)}`);
      case "neq":
        return sql.raw(`${jsonPath} != ${this.escapeValue(value)}`);
      case "gt":
        const gtValue = this.getGtGteValue(value, date);
        return gtValue !== undefined
          ? sql.raw(`${jsonPath}::numeric > ${gtValue}`)
          : sql.raw(`${jsonPath} > ${this.escapeValue(value)}`);
      case "gte":
        const gteValue = this.getGtGteValue(value, date);
        return gteValue !== undefined
          ? sql.raw(`${jsonPath}::numeric >= ${gteValue}`)
          : sql.raw(`${jsonPath} >= ${this.escapeValue(value)}`);
      case "lt":
        const ltValue = this.getLtLteValue(value, date);
        return ltValue !== undefined
          ? sql.raw(`${jsonPath}::numeric < ${ltValue}`)
          : sql.raw(`${jsonPath} < ${this.escapeValue(value)}`);
      case "lte":
        const lteValue = this.getLtLteValue(value, date);
        return lteValue !== undefined
          ? sql.raw(`${jsonPath}::numeric <= ${lteValue}`)
          : sql.raw(`${jsonPath} <= ${this.escapeValue(value)}`);
      case "like":
        const likeValue = typeof value === "string" ? value : String(value);
        const caseSensitive = part.caseSensitive ?? false;
        const operator = caseSensitive ? "LIKE" : "ILIKE";
        return sql.raw(
          `${jsonPath} ${operator} ${this.escapeValue(`%${likeValue}%`)}`
        );
      case "in":
        const inValues = Array.isArray(value) ? value : [value];
        const escapedValues = inValues
          .map((v) => this.escapeValue(v))
          .join(", ");
        return sql.raw(`${jsonPath} IN (${escapedValues})`);
      case "not_in":
        const notInValues = Array.isArray(value) ? value : [value];
        const escapedNotInValues = notInValues
          .map((v) => this.escapeValue(v))
          .join(", ");
        return sql.raw(`${jsonPath} NOT IN (${escapedNotInValues})`);
      case "between":
        const [min, max] = Array.isArray(value) ? value : [value, value];
        const betweenValues = this.getBetweenValue([min, max], date);
        if (betweenValues) {
          return sql.raw(
            `${jsonPath}::numeric BETWEEN ${betweenValues[0]} AND ${betweenValues[1]}`
          );
        }
        return sql.raw(
          `${jsonPath} BETWEEN ${this.escapeValue(min)} AND ${this.escapeValue(
            max
          )}`
        );
      case "exists":
        const existsValue = Boolean(value);
        return existsValue
          ? sql.raw(`${jsonPath} IS NOT NULL`)
          : sql.raw(`${jsonPath} IS NULL`);
      default:
        return sql`TRUE`;
    }
  }

  private buildArrayComparisonQuery(
    part: IObjPartQueryItem,
    jsonPath: string,
    date: Date
  ): ReturnType<typeof sql> {
    const { op, value } = part;

    switch (op) {
      case "eq":
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem = ${this.escapeValue(
            value
          )})`
        );
      case "neq":
        return sql.raw(
          `NOT EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem = ${this.escapeValue(
            value
          )})`
        );
      case "gt":
        const gtValue = this.getGtGteValue(value, date);
        const gtCompare =
          gtValue !== undefined ? gtValue : this.escapeValue(value);
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem::numeric > ${gtCompare})`
        );
      case "gte":
        const gteValue = this.getGtGteValue(value, date);
        const gteCompare =
          gteValue !== undefined ? gteValue : this.escapeValue(value);
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem::numeric >= ${gteCompare})`
        );
      case "lt":
        const ltValue = this.getLtLteValue(value, date);
        const ltCompare =
          ltValue !== undefined ? ltValue : this.escapeValue(value);
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem::numeric < ${ltCompare})`
        );
      case "lte":
        const lteValue = this.getLtLteValue(value, date);
        const lteCompare =
          lteValue !== undefined ? lteValue : this.escapeValue(value);
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem::numeric <= ${lteCompare})`
        );
      case "like":
        const likeValue = typeof value === "string" ? value : String(value);
        const caseSensitive = part.caseSensitive ?? false;
        const operator = caseSensitive ? "LIKE" : "ILIKE";
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem ${operator} ${this.escapeValue(
            `%${likeValue}%`
          )})`
        );
      case "in":
        const inValues = Array.isArray(value) ? value : [value];
        const escapedInValues = inValues
          .map((v) => this.escapeValue(v))
          .join(", ");
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem IN (${escapedInValues}))`
        );
      case "not_in":
        const notInValues = Array.isArray(value) ? value : [value];
        const escapedNotInValues = notInValues
          .map((v) => this.escapeValue(v))
          .join(", ");
        return sql.raw(
          `NOT EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem IN (${escapedNotInValues}))`
        );
      case "between":
        const [min, max] = Array.isArray(value) ? value : [value, value];
        const betweenValues = this.getBetweenValue([min, max], date);
        if (betweenValues) {
          return sql.raw(
            `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem::numeric BETWEEN ${betweenValues[0]} AND ${betweenValues[1]})`
          );
        }
        return sql.raw(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(${jsonPath}) AS elem WHERE elem BETWEEN ${this.escapeValue(
            min
          )} AND ${this.escapeValue(max)})`
        );
      case "exists":
        const existsValue = Boolean(value);
        return existsValue
          ? sql.raw(
              `${jsonPath} IS NOT NULL AND jsonb_array_length(${jsonPath}) > 0`
            )
          : sql.raw(
              `${jsonPath} IS NULL OR jsonb_array_length(${jsonPath}) = 0`
            );
      default:
        return sql`TRUE`;
    }
  }

  private escapeValue(value: any): string {
    if (value === null) return "NULL";
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  private isStringMetaQuery(value: any): value is IStringMetaQuery {
    return (
      typeof value === "object" &&
      value !== null &&
      (value.eq !== undefined ||
        value.neq !== undefined ||
        value.in !== undefined ||
        value.not_in !== undefined)
    );
  }

  private isNumberMetaQuery(value: any): value is INumberMetaQuery {
    return (
      typeof value === "object" &&
      value !== null &&
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
  ): ReturnType<typeof sql> | null {
    const conditions: ReturnType<typeof sql>[] = [];
    const dbColumn = mapFieldToDbColumn(key);

    if (value.eq !== undefined) {
      conditions.push(sql`${sql.identifier(dbColumn)} = ${value.eq}`);
    }
    if (value.neq !== undefined) {
      conditions.push(sql`${sql.identifier(dbColumn)} != ${value.neq}`);
    }
    if (value.in !== undefined && value.in.length > 0) {
      conditions.push(
        sql`${sql.identifier(dbColumn)} IN (${sql.join(
          value.in.map((v) => sql`${v}`),
          sql`, `
        )})`
      );
    }
    if (value.not_in !== undefined && value.not_in.length > 0) {
      conditions.push(
        sql`${sql.identifier(dbColumn)} NOT IN (${sql.join(
          value.not_in.map((v) => sql`${v}`),
          sql`, `
        )})`
      );
    }

    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];
    return sql.join(conditions, sql` AND `);
  }

  private transformNumberMetaQuery(
    key: string,
    value: INumberMetaQuery,
    date: Date,
    forceString: boolean = false
  ): ReturnType<typeof sql> | null {
    const conditions: ReturnType<typeof sql>[] = [];
    const dbColumn = mapFieldToDbColumn(key);

    const getValue = (v: any) => (forceString ? sql`${String(v)}` : sql`${v}`);

    if (value.eq !== undefined) {
      conditions.push(sql`${sql.identifier(dbColumn)} = ${getValue(value.eq)}`);
    }
    if (value.neq !== undefined) {
      conditions.push(
        sql`${sql.identifier(dbColumn)} != ${getValue(value.neq)}`
      );
    }
    if (value.in !== undefined && value.in.length > 0) {
      conditions.push(
        sql`${sql.identifier(dbColumn)} IN (${sql.join(
          value.in.map((v) => getValue(v)),
          sql`, `
        )})`
      );
    }
    if (value.not_in !== undefined && value.not_in.length > 0) {
      conditions.push(
        sql`${sql.identifier(dbColumn)} NOT IN (${sql.join(
          value.not_in.map((v) => getValue(v)),
          sql`, `
        )})`
      );
    }
    if (value.gt !== undefined) {
      const gtValue = this.getGtGteValue(value.gt, date);
      conditions.push(
        sql`${sql.identifier(dbColumn)} > ${getValue(gtValue ?? value.gt)}`
      );
    }
    if (value.gte !== undefined) {
      const gteValue = this.getGtGteValue(value.gte, date);
      conditions.push(
        sql`${sql.identifier(dbColumn)} >= ${getValue(gteValue ?? value.gte)}`
      );
    }
    if (value.lt !== undefined) {
      const ltValue = this.getLtLteValue(value.lt, date);
      conditions.push(
        sql`${sql.identifier(dbColumn)} < ${getValue(ltValue ?? value.lt)}`
      );
    }
    if (value.lte !== undefined) {
      const lteValue = this.getLtLteValue(value.lte, date);
      conditions.push(
        sql`${sql.identifier(dbColumn)} <= ${getValue(lteValue ?? value.lte)}`
      );
    }
    if (value.between !== undefined) {
      const [min, max] = value.between;
      const betweenValues = this.getBetweenValue([min, max], date);
      if (betweenValues) {
        conditions.push(
          sql`${sql.identifier(dbColumn)} BETWEEN ${getValue(
            betweenValues[0]
          )} AND ${getValue(betweenValues[1])}`
        );
      } else {
        conditions.push(
          sql`${sql.identifier(dbColumn)} BETWEEN ${getValue(
            min
          )} AND ${getValue(max)}`
        );
      }
    }

    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];
    return sql.join(conditions, sql` AND `);
  }

  protected getGtGteValue(value: any, date: Date): number | undefined {
    const { valueNumber, durationMs } =
      this.getNumberOrDurationMsFromValue(value);

    if (typeof valueNumber === "number") {
      return valueNumber;
    }

    if (durationMs) {
      return new Date(date.getTime() + durationMs).getTime();
    }

    return undefined;
  }

  protected getLtLteValue(value: any, date: Date): number | undefined {
    const { valueNumber, durationMs } =
      this.getNumberOrDurationMsFromValue(value);

    if (typeof valueNumber === "number") {
      return valueNumber;
    }

    if (durationMs) {
      return new Date(date.getTime() - durationMs).getTime();
    }

    return undefined;
  }

  protected getBetweenValue(
    value: [any, any],
    date: Date
  ): [number, number] | undefined {
    const [min, max] = value;
    const minValue = this.getGtGteValue(min, date);
    const maxValue = this.getLtLteValue(max, date);

    if (minValue !== undefined && maxValue !== undefined) {
      return [minValue, maxValue];
    }

    return undefined;
  }
}
