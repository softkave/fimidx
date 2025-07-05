import type { FilterQuery, SortOrder } from "mongoose";
import type {
  INumberMetaQuery,
  IObj,
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

export class MongoQueryTransformer extends BaseQueryTransformer<
  FilterQuery<IObj>
> {
  transformFilter(query: IObjQuery, date: Date): FilterQuery<IObj> {
    const filters: FilterQuery<IObj>[] = [];

    // Add appId filter
    if (query.appId) {
      filters.push({ appId: query.appId });
    }

    // Add part query filter
    if (query.partQuery) {
      const partFilter = this.transformLogicalQuery(query.partQuery, date);
      if (Object.keys(partFilter).length > 0) filters.push(partFilter);
    }

    // Add meta query filter
    if (query.metaQuery) {
      const metaFilter = this.transformMetaQuery(query.metaQuery, date);
      if (Object.keys(metaFilter).length > 0) filters.push(metaFilter);
    }

    // Add top-level fields filter
    if (query.topLevelFields) {
      const topLevelFilter = this.transformTopLevelFields(
        query.topLevelFields,
        date
      );
      if (Object.keys(topLevelFilter).length > 0) filters.push(topLevelFilter);
    }

    if (filters.length === 0) return {};
    if (filters.length === 1) return filters[0];
    return { $and: filters };
  }

  transformSort(
    sort: IObjSortList,
    fields?: IObjField[]
  ): Record<string, SortOrder> {
    if (sort.length === 0) {
      return { createdAt: -1 };
    }

    const sortObj: Record<string, SortOrder> = {};

    sort.forEach((sortItem) => {
      const direction = sortItem.direction === "asc" ? 1 : -1;
      let outputField = sortItem.field;
      let matchField = sortItem.field;

      // If the field starts with 'objRecord.', strip it for matching
      if (sortItem.field.startsWith("objRecord.")) {
        matchField = sortItem.field.slice("objRecord.".length);
      }

      // Check if field exists in fields array
      if (fields) {
        const fieldInfo = fields.find((f) => f.field === matchField);
        if (!fieldInfo) {
          // Skip this sort field if not found in fields array
          return;
        }
      }

      // Output field: use as-is (do not add objRecord. prefix if not present)
      sortObj[outputField] = direction;
    });

    // If no valid sort clauses, return default
    if (Object.keys(sortObj).length === 0) {
      return { createdAt: -1 };
    }

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
    const fieldOps: Record<string, Record<string, any>> = {};

    partQuery.forEach((part) => {
      const field = `objRecord.${part.field}`;
      if (!fieldOps[field]) fieldOps[field] = {};
      switch (part.op) {
        case "eq":
          fieldOps[field]["$eq"] = part.value;
          break;
        case "neq":
          fieldOps[field]["$ne"] = part.value;
          break;
        case "gt": {
          const value = this.getGtGteValue(part.value, date);
          if (value !== undefined) fieldOps[field]["$gt"] = value;
          break;
        }
        case "gte": {
          const value = this.getGtGteValue(part.value, date);
          if (value !== undefined) fieldOps[field]["$gte"] = value;
          break;
        }
        case "lt": {
          const value = this.getLtLteValue(part.value, date);
          if (value !== undefined) fieldOps[field]["$lt"] = value;
          break;
        }
        case "lte": {
          const value = this.getLtLteValue(part.value, date);
          if (value !== undefined) fieldOps[field]["$lte"] = value;
          break;
        }
        case "like": {
          fieldOps[field]["$regex"] = new RegExp(
            part.value,
            part.caseSensitive ? "" : "i"
          );
          break;
        }
        case "in":
          fieldOps[field]["$in"] = part.value;
          break;
        case "not_in":
          fieldOps[field]["$nin"] = part.value;
          break;
        case "between": {
          const [min, max] = this.getBetweenValue(part.value, date) || [];
          if (min !== undefined && max !== undefined) {
            fieldOps[field]["$gte"] = min;
            fieldOps[field]["$lte"] = max;
          }
          break;
        }
        case "exists": {
          fieldOps[field]["$exists"] = part.value;
          break;
        }
      }
    });

    // Flatten: if only $eq, keep as { $eq: value }, not just value
    const pongoQuery: FilterQuery<IObj> = {};
    for (const [field, ops] of Object.entries(fieldOps)) {
      pongoQuery[field] = { ...ops };
    }
    return pongoQuery;
  }

  protected transformLogicalQuery(
    logicalQuery: IObjPartLogicalQuery,
    date: Date
  ): FilterQuery<IObj> {
    let filter: FilterQuery<IObj> = {};

    const hasAnd = !!logicalQuery.and;
    const hasOr = !!logicalQuery.or;

    if (hasAnd && hasOr) {
      const andQuery = this.transformPartQuery(logicalQuery.and!, date);
      const orArray = logicalQuery.or!.map((part) =>
        this.transformPartQuery([part], date)
      );
      filter = { $or: [andQuery, ...orArray] };
    } else if (hasAnd) {
      filter = this.transformPartQuery(logicalQuery.and!, date);
    } else if (hasOr) {
      const orArray = logicalQuery.or!.map((part) =>
        this.transformPartQuery([part], date)
      );
      filter = { $or: orArray };
    }

    return filter;
  }

  protected transformMetaQuery(
    metaQuery: IObjMetaQuery,
    date: Date
  ): FilterQuery<IObj> {
    const filter: FilterQuery<IObj> = {};

    Object.entries(metaQuery).forEach(([key, value]) => {
      // Map meta fields to top-level fields
      const fieldMap: Record<string, string> = {
        createdAt: "createdAt",
        updatedAt: "updatedAt",
        updatedBy: "updatedBy",
        updatedByType: "updatedByType",
        createdBy: "createdBy",
        createdByType: "createdByType",
        deletedAt: "deletedAt",
        deletedBy: "deletedBy",
        deletedByType: "deletedByType",
      };
      const mappedKey = fieldMap[key] || key;
      if (this.isStringMetaQuery(value)) {
        this.transformStringMetaQuery(filter, mappedKey, value, true);
      } else if (this.isNumberMetaQuery(value)) {
        this.transformNumberMetaQuery(filter, mappedKey, value, date, true);
      }
    });

    return filter;
  }

  protected transformTopLevelFields(
    topLevelFields: ITopLevelFieldQuery,
    date: Date
  ): FilterQuery<IObj> {
    const filter: FilterQuery<IObj> = {};

    // Handle shouldIndex (boolean field)
    if (topLevelFields.shouldIndex !== undefined) {
      filter.shouldIndex = topLevelFields.shouldIndex;
    }

    // Handle fieldsToIndex (array field)
    if (topLevelFields.fieldsToIndex !== undefined) {
      filter.fieldsToIndex = topLevelFields.fieldsToIndex;
    }

    // Handle tag (string meta query)
    if (topLevelFields.tag) {
      this.transformStringMetaQuery(filter, "tag", topLevelFields.tag, true);
    }

    // Handle groupId (string meta query)
    if (topLevelFields.groupId) {
      this.transformStringMetaQuery(
        filter,
        "groupId",
        topLevelFields.groupId,
        true
      );
    }

    // Handle deletedAt (null or number meta query)
    if (topLevelFields.deletedAt !== undefined) {
      if (topLevelFields.deletedAt === null) {
        filter.deletedAt = null;
      } else {
        this.transformNumberMetaQuery(
          filter,
          "deletedAt",
          topLevelFields.deletedAt,
          date,
          true
        );
      }
    }

    // Handle deletedBy (string meta query)
    if (topLevelFields.deletedBy) {
      this.transformStringMetaQuery(
        filter,
        "deletedBy",
        topLevelFields.deletedBy,
        true
      );
    }

    // Handle deletedByType (string meta query)
    if (topLevelFields.deletedByType) {
      this.transformStringMetaQuery(
        filter,
        "deletedByType",
        topLevelFields.deletedByType,
        true
      );
    }

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
        value.not_in !== undefined ||
        value.gt !== undefined ||
        value.gte !== undefined ||
        value.lt !== undefined ||
        value.lte !== undefined ||
        value.between !== undefined)
    );
  }

  private transformStringMetaQuery(
    filter: FilterQuery<IObj>,
    key: string,
    value: IStringMetaQuery,
    useFlatKeys = false
  ): void {
    const hasEq = value.eq !== undefined;
    const hasOther =
      value.neq !== undefined ||
      value.in !== undefined ||
      value.not_in !== undefined;
    // Always use object form for meta queries (fix for $in, $ne, etc.)
    if (hasEq && !hasOther) {
      filter[key] = value.eq;
    } else {
      const obj: any = {};
      if (hasEq) obj.$eq = value.eq;
      if (value.neq !== undefined) obj.$ne = value.neq;
      if (value.in !== undefined) obj.$in = value.in;
      if (value.not_in !== undefined) obj.$nin = value.not_in;
      filter[key] = obj;
    }
  }

  private transformNumberMetaQuery(
    filter: FilterQuery<IObj>,
    key: string,
    value: INumberMetaQuery,
    date: Date,
    useFlatKeys = false
  ): void {
    // If the key is a date field, always convert values to Date objects
    const isDateField = ["createdAt", "updatedAt", "deletedAt"].includes(key);
    const toDate = (v: any) => {
      if (v instanceof Date) return v;
      if (typeof v === "string" || typeof v === "number") return new Date(v);
      return v;
    };
    const eqValue =
      value.eq !== undefined
        ? isDateField
          ? toDate(value.eq)
          : this.getNumberOrDurationMsFromValue(value.eq).valueNumber
        : undefined;
    const neqValue =
      value.neq !== undefined
        ? isDateField
          ? toDate(value.neq)
          : this.getNumberOrDurationMsFromValue(value.neq).valueNumber
        : undefined;
    const inValues = value.in
      ? value.in
          .map((v) =>
            isDateField
              ? toDate(v)
              : this.getNumberOrDurationMsFromValue(v).valueNumber
          )
          .filter((v) => v !== undefined)
      : undefined;
    const notInValues = value.not_in
      ? value.not_in
          .map((v) =>
            isDateField
              ? toDate(v)
              : this.getNumberOrDurationMsFromValue(v).valueNumber
          )
          .filter((v) => v !== undefined)
      : undefined;
    // Handle gt/gte/lt/lte
    const gtValue =
      value.gt !== undefined
        ? isDateField
          ? toDate(value.gt)
          : this.getGtGteValue(value.gt, date)
        : undefined;
    const gteValue =
      value.gte !== undefined
        ? isDateField
          ? toDate(value.gte)
          : this.getGtGteValue(value.gte, date)
        : undefined;
    const ltValue =
      value.lt !== undefined
        ? isDateField
          ? toDate(value.lt)
          : this.getLtLteValue(value.lt, date)
        : undefined;
    const lteValue =
      value.lte !== undefined
        ? isDateField
          ? toDate(value.lte)
          : this.getLtLteValue(value.lte, date)
        : undefined;
    const hasEq = eqValue !== undefined;
    const hasOther =
      neqValue !== undefined ||
      (inValues && inValues.length > 0) ||
      (notInValues && notInValues.length > 0) ||
      gtValue !== undefined ||
      gteValue !== undefined ||
      ltValue !== undefined ||
      lteValue !== undefined;
    // Always use object form for meta queries (fix for $in, $ne, etc.)
    if (hasEq && !hasOther) {
      filter[key] = eqValue;
    } else {
      const obj: any = {};
      if (hasEq) obj.$eq = eqValue;
      if (neqValue !== undefined) obj.$ne = neqValue;
      if (inValues && inValues.length > 0) obj.$in = inValues;
      if (notInValues && notInValues.length > 0) obj.$nin = notInValues;
      if (gtValue !== undefined) obj.$gt = gtValue;
      if (gteValue !== undefined) obj.$gte = gteValue;
      if (ltValue !== undefined) obj.$lt = ltValue;
      if (lteValue !== undefined) obj.$lte = lteValue;
      filter[key] = obj;
    }
  }
}
