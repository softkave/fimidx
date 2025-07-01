import { sql } from "drizzle-orm";
import type {
  INumberMetaQuery,
  IObjMetaQuery,
  IObjPartLogicalQuery,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
  IStringMetaQuery,
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
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    partQuery.forEach((part) => {
      const fieldPath = `obj_record.${part.field}`;
      const jsonPath = fieldPath
        .split(".")
        .map((segment) => `"${segment}"`)
        .join("->");

      switch (part.op) {
        case "eq":
          conditions.push(
            sql`${sql.raw(`obj_record->${jsonPath}`)} = ${JSON.stringify(
              part.value
            )}`
          );
          break;
        case "neq":
          conditions.push(
            sql`${sql.raw(`obj_record->${jsonPath}`)} != ${JSON.stringify(
              part.value
            )}`
          );
          break;
        case "gt": {
          const value = this.getGtGteValue(part.value, date);
          if (value !== undefined) {
            conditions.push(
              sql`${sql.raw(`obj_record->${jsonPath}`)}::numeric > ${value}`
            );
          }
          break;
        }
        case "gte": {
          const value = this.getGtGteValue(part.value, date);
          if (value !== undefined) {
            conditions.push(
              sql`${sql.raw(`obj_record->${jsonPath}`)}::numeric >= ${value}`
            );
          }
          break;
        }
        case "lt": {
          const value = this.getLtLteValue(part.value, date);
          if (value !== undefined) {
            conditions.push(
              sql`${sql.raw(`obj_record->${jsonPath}`)}::numeric < ${value}`
            );
          }
          break;
        }
        case "lte": {
          const value = this.getLtLteValue(part.value, date);
          if (value !== undefined) {
            conditions.push(
              sql`${sql.raw(`obj_record->${jsonPath}`)}::numeric <= ${value}`
            );
          }
          break;
        }
        case "like": {
          const regex = part.caseSensitive ? part.value : `(?i)${part.value}`;
          conditions.push(
            sql`${sql.raw(`obj_record->${jsonPath}`)}::text ~ ${regex}`
          );
          break;
        }
        case "in":
          const inValues = part.value.map((v) => JSON.stringify(v));
          conditions.push(
            sql`${sql.raw(`obj_record->${jsonPath}`)} IN (${sql.join(
              inValues.map((v) => sql`${v}`),
              sql`, `
            )})`
          );
          break;
        case "not_in":
          const notInValues = part.value.map((v) => JSON.stringify(v));
          conditions.push(
            sql`${sql.raw(`obj_record->${jsonPath}`)} NOT IN (${sql.join(
              notInValues.map((v) => sql`${v}`),
              sql`, `
            )})`
          );
          break;
        case "between": {
          const [min, max] = this.getBetweenValue(part.value, date) || [];
          if (min !== undefined && max !== undefined) {
            conditions.push(
              sql`${sql.raw(
                `obj_record->${jsonPath}`
              )}::numeric BETWEEN ${min} AND ${max}`
            );
          }
          break;
        }
        case "exists": {
          if (part.value) {
            conditions.push(
              sql`${sql.raw(`obj_record->${jsonPath}`)} IS NOT NULL`
            );
          } else {
            conditions.push(sql`${sql.raw(`obj_record->${jsonPath}`)} IS NULL`);
          }
          break;
        }
      }
    });

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  protected transformLogicalQuery(
    logicalQuery: IObjPartLogicalQuery,
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    if (logicalQuery.and) {
      const andQuery = this.transformPartQuery(logicalQuery.and, date);
      conditions.push(andQuery);
    }

    if (logicalQuery.or) {
      const orQuery = this.transformPartQuery(logicalQuery.or, date);
      conditions.push(sql`(${orQuery})`);
    }

    if (conditions.length === 0) {
      return sql`TRUE`;
    }

    return sql.join(conditions, sql` AND `);
  }

  protected transformMetaQuery(
    metaQuery: IObjMetaQuery,
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    Object.entries(metaQuery).forEach(([key, value]) => {
      if (this.isStringMetaQuery(value)) {
        const stringCondition = this.transformStringMetaQuery(key, value);
        conditions.push(stringCondition);
      } else if (this.isNumberMetaQuery(value)) {
        const numberCondition = this.transformNumberMetaQuery(key, value, date);
        conditions.push(numberCondition);
      }
    });

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
    date: Date
  ): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];

    if (value.eq !== undefined) {
      const eqValue = this.getNumberOrDurationMsFromValue(value.eq).valueNumber;
      if (eqValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} = ${eqValue}`);
      }
    }
    if (value.neq !== undefined) {
      const neqValue = this.getNumberOrDurationMsFromValue(
        value.neq
      ).valueNumber;
      if (neqValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} != ${neqValue}`);
      }
    }
    if (value.in !== undefined && value.in.length > 0) {
      const inValues = value.in
        .map((v) => this.getNumberOrDurationMsFromValue(v).valueNumber)
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
        .map((v) => this.getNumberOrDurationMsFromValue(v).valueNumber)
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
      const gtValue = this.getGtGteValue(value.gt, date);
      if (gtValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} > ${gtValue}`);
      }
    }
    if (value.gte !== undefined) {
      const gteValue = this.getGtGteValue(value.gte, date);
      if (gteValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} >= ${gteValue}`);
      }
    }
    if (value.lt !== undefined) {
      const ltValue = this.getLtLteValue(value.lt, date);
      if (ltValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} < ${ltValue}`);
      }
    }
    if (value.lte !== undefined) {
      const lteValue = this.getLtLteValue(value.lte, date);
      if (lteValue !== undefined) {
        conditions.push(sql`${sql.identifier(key)} <= ${lteValue}`);
      }
    }
    if (value.between !== undefined) {
      const [min, max] = this.getBetweenValue(value.between, date) || [];
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
