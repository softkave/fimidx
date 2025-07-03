import { sql } from "drizzle-orm";
import type {
  INumberMetaQuery,
  IObjMetaQuery,
  IObjPartLogicalQuery,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
  IStringMetaQuery,
  ITopLevelFieldQuery,
} from "../../definitions/obj.js";
import { BaseQueryTransformer } from "./BaseQueryTransformer.js";

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

  transformSort(sort: IObjSortList): ReturnType<typeof sql> {
    if (sort.length === 0) {
      return sql`created_at DESC`;
    }

    const sortClauses = sort.map((sortItem) => {
      const direction = sortItem.direction === "asc" ? sql`ASC` : sql`DESC`;
      return sql`${sql.identifier(sortItem.field)} ${direction}`;
    });

    return sql.join(sortClauses, sql`, `);
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
      // Build JSON path for obj_record: use -> for all but last, ->> for last
      const segments = part.field.split(".");
      const jsonPath = segments
        .map((segment, i) =>
          i === segments.length - 1 ? `->'${segment}'` : `->'${segment}'`
        )
        .join("");
      const fieldExpr = sql.raw(`obj_record${jsonPath}`);
      const fieldExprText = sql.raw(`obj_record${jsonPath}::text`);
      switch (part.op) {
        case "eq":
          conditions.push(
            sql`${fieldExprText} = ${JSON.stringify(part.value)}`
          );
          break;
        case "neq":
          conditions.push(
            sql`${fieldExprText} != ${JSON.stringify(part.value)}`
          );
          break;
        case "gt": {
          if (typeof part.value === "number") {
            const typeCheck = sql.raw(
              `jsonb_typeof(obj_record${jsonPath}) = 'number'`
            );
            conditions.push(
              sql`(${typeCheck} AND (${fieldExpr})::numeric > ${part.value})`
            );
          }
          break;
        }
        case "gte": {
          if (typeof part.value === "number") {
            const typeCheck = sql.raw(
              `jsonb_typeof(obj_record${jsonPath}) = 'number'`
            );
            conditions.push(
              sql`(${typeCheck} AND (${fieldExpr})::numeric >= ${part.value})`
            );
          }
          break;
        }
        case "lt": {
          if (typeof part.value === "number") {
            const typeCheck = sql.raw(
              `jsonb_typeof(obj_record${jsonPath}) = 'number'`
            );
            conditions.push(
              sql`(${typeCheck} AND (${fieldExpr})::numeric < ${part.value})`
            );
          }
          break;
        }
        case "lte": {
          if (typeof part.value === "number") {
            const typeCheck = sql.raw(
              `jsonb_typeof(obj_record${jsonPath}) = 'number'`
            );
            conditions.push(
              sql`(${typeCheck} AND (${fieldExpr})::numeric <= ${part.value})`
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
          // If the field is an array, use @> for containment
          if (Array.isArray(part.value)) {
            conditions.push(sql`${fieldExpr} @> ${JSON.stringify(part.value)}`);
          }
          break;
        }
        case "not_in": {
          if (Array.isArray(part.value)) {
            conditions.push(
              sql`NOT (${fieldExpr} @> ${JSON.stringify(part.value)})`
            );
          }
          break;
        }
        case "between": {
          if (
            Array.isArray(part.value) &&
            part.value.length === 2 &&
            typeof part.value[0] === "number" &&
            typeof part.value[1] === "number"
          ) {
            const typeCheck = sql.raw(
              `jsonb_typeof(obj_record${jsonPath}) = 'number'`
            );
            conditions.push(
              sql`(${typeCheck} AND (${fieldExpr})::numeric BETWEEN ${part.value[0]} AND ${part.value[1]})`
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
    // Map camelCase keys to snake_case columns
    const keyMap: Record<string, string> = {
      id: "id",
      createdAt: "created_at",
      updatedAt: "updated_at",
      createdBy: "created_by",
      updatedBy: "updated_by",
    };
    Object.entries(metaQuery).forEach(([key, value]) => {
      const dbKey = keyMap[key] || key;
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
      conditions.push(sql`should_index = ${topLevelFields.shouldIndex}`);
    }

    // Handle fieldsToIndex (array field)
    if (topLevelFields.fieldsToIndex !== undefined) {
      conditions.push(
        sql`fields_to_index = ${JSON.stringify(topLevelFields.fieldsToIndex)}`
      );
    }

    // Handle tag (string meta query)
    if (topLevelFields.tag) {
      const tagCondition = this.transformStringMetaQuery(
        "tag",
        topLevelFields.tag
      );
      conditions.push(tagCondition);
    }

    // Handle groupId (string meta query)
    if (topLevelFields.groupId) {
      const groupIdCondition = this.transformStringMetaQuery(
        "group_id",
        topLevelFields.groupId
      );
      conditions.push(groupIdCondition);
    }

    // Handle deletedAt (null or number meta query)
    if (topLevelFields.deletedAt !== undefined) {
      if (topLevelFields.deletedAt === null) {
        conditions.push(sql`deleted_at IS NULL`);
      } else {
        const deletedAtCondition = this.transformNumberMetaQuery(
          "deleted_at",
          topLevelFields.deletedAt,
          date
        );
        conditions.push(deletedAtCondition);
      }
    }

    // Handle deletedBy (string meta query)
    if (topLevelFields.deletedBy) {
      const deletedByCondition = this.transformStringMetaQuery(
        "deleted_by",
        topLevelFields.deletedBy
      );
      conditions.push(deletedByCondition);
    }

    // Handle deletedByType (string meta query)
    if (topLevelFields.deletedByType) {
      const deletedByTypeCondition = this.transformStringMetaQuery(
        "deleted_by_type",
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
