import { set } from "lodash-es";
import type { FilterQuery, SortOrder } from "mongoose";
import { isObjectEmpty } from "softkave-js-utils";
import type {
  INumberMetaQuery,
  IObj,
  IObjMetaQuery,
  IObjPartLogicalQuery,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
  IStringMetaQuery,
} from "../../definitions/obj.js";
import { BaseQueryTransformer } from "./BaseQueryTransformer.js";

export class MongoQueryTransformer extends BaseQueryTransformer<
  FilterQuery<IObj>
> {
  transformFilter(query: IObjQuery, date: Date): FilterQuery<IObj> {
    const filter: FilterQuery<IObj> = {};

    // Add appId filter
    if (query.appId) {
      filter.appId = query.appId;
    }

    // Add part query filter
    if (query.partQuery) {
      const partFilter = this.transformLogicalQuery(query.partQuery, date);
      Object.assign(filter, partFilter);
    }

    // Add meta query filter
    if (query.metaQuery) {
      const metaFilter = this.transformMetaQuery(query.metaQuery, date);
      Object.assign(filter, metaFilter);
    }

    return filter;
  }

  transformSort(sort: IObjSortList): Record<string, SortOrder> {
    const sortObj: Record<string, SortOrder> = {};

    sort.forEach((sortItem) => {
      const direction = sortItem.direction === "asc" ? 1 : -1;
      sortObj[sortItem.field] = direction;
    });

    return sortObj;
  }

  transformPagination(
    page: number,
    limit: number
  ): { skip: number; limit: number } {
    return {
      skip: page * limit,
      limit,
    };
  }

  protected transformPartQuery(
    partQuery: IObjPartQueryList,
    date: Date
  ): FilterQuery<IObj> {
    const pongoQuery: FilterQuery<IObj> = {};

    partQuery.forEach((part) => {
      const field = `objRecord.${part.field}`;

      switch (part.op) {
        case "eq":
          set(pongoQuery, `${field}.$eq`, part.value);
          break;
        case "neq":
          set(pongoQuery, `${field}.$ne`, part.value);
          break;
        case "gt": {
          const value = this.getGtGteValue(part.value, date);
          if (value !== undefined) {
            set(pongoQuery, `${field}.$gt`, value);
          }
          break;
        }
        case "gte": {
          const value = this.getGtGteValue(part.value, date);
          if (value !== undefined) {
            set(pongoQuery, `${field}.$gte`, value);
          }
          break;
        }
        case "lt": {
          const value = this.getLtLteValue(part.value, date);
          if (value !== undefined) {
            set(pongoQuery, `${field}.$lt`, value);
          }
          break;
        }
        case "lte": {
          const value = this.getLtLteValue(part.value, date);
          if (value !== undefined) {
            set(pongoQuery, `${field}.$lte`, value);
          }
          break;
        }
        case "like": {
          set(
            pongoQuery,
            `${field}.$regex`,
            new RegExp(part.value, part.caseSensitive ? "" : "i")
          );
          break;
        }
        case "in":
          set(pongoQuery, `${field}.$in`, part.value);
          break;
        case "not_in":
          set(pongoQuery, `${field}.$nin`, part.value);
          break;
        case "between": {
          const [min, max] = this.getBetweenValue(part.value, date) || [];
          if (min !== undefined && max !== undefined) {
            set(pongoQuery, `${field}.$gte`, min);
            set(pongoQuery, `${field}.$lte`, max);
          }
          break;
        }
        case "exists": {
          set(pongoQuery, `${field}.$exists`, part.value);
          break;
        }
      }
    });

    return pongoQuery;
  }

  protected transformLogicalQuery(
    logicalQuery: IObjPartLogicalQuery,
    date: Date
  ): FilterQuery<IObj> {
    let filter: FilterQuery<IObj> = {};

    if (logicalQuery.and) {
      const andQuery = this.transformPartQuery(logicalQuery.and, date);
      if (andQuery && !isObjectEmpty(andQuery)) {
        filter = andQuery;
      }
    }

    if (logicalQuery.or) {
      const orQuery = this.transformPartQuery(logicalQuery.or, date);
      if (orQuery && !isObjectEmpty(orQuery)) {
        set(filter, "$or", Object.values(orQuery));
      }
    }

    return filter;
  }

  protected transformMetaQuery(
    metaQuery: IObjMetaQuery,
    date: Date
  ): FilterQuery<IObj> {
    const filter: FilterQuery<IObj> = {};

    Object.entries(metaQuery).forEach(([key, value]) => {
      if (this.isStringMetaQuery(value)) {
        this.transformStringMetaQuery(filter, key, value);
      } else if (this.isNumberMetaQuery(value)) {
        this.transformNumberMetaQuery(filter, key, value, date);
      }
    });

    return filter;
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
        value.not_in !== undefined)
    );
  }

  private transformStringMetaQuery(
    filter: FilterQuery<IObj>,
    key: string,
    value: IStringMetaQuery
  ): void {
    if (value.eq !== undefined) {
      filter[key] = value.eq;
    }
    if (value.neq !== undefined) {
      set(filter, `${key}.$ne`, value.neq);
    }
    if (value.in !== undefined) {
      set(filter, `${key}.$in`, value.in);
    }
    if (value.not_in !== undefined) {
      set(filter, `${key}.$nin`, value.not_in);
    }
  }

  private transformNumberMetaQuery(
    filter: FilterQuery<IObj>,
    key: string,
    value: INumberMetaQuery,
    date: Date
  ): void {
    if (value.eq !== undefined) {
      const eqValue = this.getNumberOrDurationMsFromValue(value.eq).valueNumber;
      if (eqValue !== undefined) {
        filter[key] = eqValue;
      }
    }
    if (value.neq !== undefined) {
      const neqValue = this.getNumberOrDurationMsFromValue(
        value.neq
      ).valueNumber;
      if (neqValue !== undefined) {
        set(filter, `${key}.$ne`, neqValue);
      }
    }
    if (value.in !== undefined) {
      const inValues = value.in
        .map((v) => this.getNumberOrDurationMsFromValue(v).valueNumber)
        .filter((v) => v !== undefined);
      if (inValues.length > 0) {
        set(filter, `${key}.$in`, inValues);
      }
    }
    if (value.not_in !== undefined) {
      const notInValues = value.not_in
        .map((v) => this.getNumberOrDurationMsFromValue(v).valueNumber)
        .filter((v) => v !== undefined);
      if (notInValues.length > 0) {
        set(filter, `${key}.$nin`, notInValues);
      }
    }
  }
}
