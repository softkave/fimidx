import type { FilterQuery, SortOrder } from "mongoose";
import type {
  INumberMetaQuery,
  IObj,
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

export class MongoQueryTransformer extends BaseQueryTransformer<
  FilterQuery<IObj>
> {
  transformFilter(
    query: IObjQuery,
    date: Date,
    arrayFields?: Map<string, IObjArrayField>
  ): FilterQuery<IObj> {
    const filters: FilterQuery<IObj>[] = [];

    // Add appId filter
    if (query.appId) {
      filters.push({ appId: query.appId });
    }

    // Add part query filter
    if (query.partQuery) {
      const partFilter = this.transformLogicalQuery(
        query.partQuery,
        date,
        arrayFields
      );
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
    date: Date,
    arrayFields?: Map<string, IObjArrayField>
  ): FilterQuery<IObj> {
    const fieldOps: Record<string, Record<string, any>> = {};

    partQuery.forEach((part) => {
      // Check if this field involves array access
      const arrayField = this.findArrayField(part.field, arrayFields);

      if (arrayField) {
        // Generate MongoDB array query
        const arrayQuery = this.generateMongoArrayQuery(part, arrayField, date);
        // Merge operations for the same field
        for (const [fieldPath, operations] of Object.entries(arrayQuery)) {
          if (!fieldOps[fieldPath]) fieldOps[fieldPath] = {};
          Object.assign(fieldOps[fieldPath], operations);
        }
      } else {
        // Fall back to regular field query
        const field = `objRecord.${part.field}`;
        if (!fieldOps[field]) fieldOps[field] = {};
        this.addFieldOperation(fieldOps[field], part, date);
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
    date: Date,
    arrayFields?: Map<string, IObjArrayField>
  ): FilterQuery<IObj> {
    let filter: FilterQuery<IObj> = {};

    const hasAnd = !!logicalQuery.and;
    const hasOr = !!logicalQuery.or;

    if (hasAnd && hasOr) {
      // When both AND and OR are present, we want: (AND conditions) OR (OR conditions)
      const andQuery = this.transformPartQuery(
        logicalQuery.and!,
        date,
        arrayFields
      );
      const orArray = logicalQuery.or!.map((part) =>
        this.transformPartQuery([part], date, arrayFields)
      );

      // Create an OR query that combines the AND result with the OR results
      const orConditions = [andQuery, ...orArray];
      filter = { $or: orConditions };
    } else if (hasAnd) {
      filter = this.transformPartQuery(logicalQuery.and!, date, arrayFields);
    } else if (hasOr) {
      const orArray = logicalQuery.or!.map((part) =>
        this.transformPartQuery([part], date, arrayFields)
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

  private findArrayField(
    field: string,
    arrayFields?: Map<string, IObjArrayField>
  ): IObjArrayField | undefined {
    if (!arrayFields) return undefined;

    const segments = field.split(".");

    // Check if any parent path is an array field
    for (let i = 1; i <= segments.length; i++) {
      const parentPath = segments.slice(0, i).join(".");
      const arrayField = arrayFields.get(parentPath);
      if (arrayField) {
        return arrayField;
      }
    }

    return undefined;
  }

  private generateMongoArrayQuery(
    part: IObjPartQueryItem,
    arrayField: IObjArrayField,
    date: Date
  ): Record<string, Record<string, any>> {
    const segments = part.field.split(".");
    const arrayFieldPath = arrayField.field; // e.g., 'logsQuery.and'
    const arrayFieldSegments = arrayFieldPath.split(".");

    // Find the part after the array field
    const remainingPath = segments.slice(arrayFieldSegments.length).join(".");
    const fullPath = `objRecord.${arrayFieldPath}.${remainingPath}`;

    const fieldOps: Record<string, Record<string, any>> = {};
    fieldOps[fullPath] = {};

    // Check if this value should be treated as a date based on its content
    const shouldTreatAsDate = this.shouldTreatValueAsDate(part.value);

    switch (part.op) {
      case "eq":
        fieldOps[fullPath]["$eq"] = part.value;
        break;
      case "neq":
        fieldOps[fullPath]["$ne"] = part.value;
        break;
      case "gt": {
        const value = shouldTreatAsDate
          ? this.getGtGteValueAsDate(part.value, date)
          : this.getGtGteValue(part.value, date);
        if (value !== undefined) fieldOps[fullPath]["$gt"] = value;
        break;
      }
      case "gte": {
        const value = shouldTreatAsDate
          ? this.getGtGteValueAsDate(part.value, date)
          : this.getGtGteValue(part.value, date);
        if (value !== undefined) fieldOps[fullPath]["$gte"] = value;
        break;
      }
      case "lt": {
        const value = shouldTreatAsDate
          ? this.getLtLteValueAsDate(part.value, date)
          : this.getLtLteValue(part.value, date);
        if (value !== undefined) fieldOps[fullPath]["$lt"] = value;
        break;
      }
      case "lte": {
        const value = shouldTreatAsDate
          ? this.getLtLteValueAsDate(part.value, date)
          : this.getLtLteValue(part.value, date);
        if (value !== undefined) fieldOps[fullPath]["$lte"] = value;
        break;
      }
      case "like": {
        fieldOps[fullPath]["$regex"] = new RegExp(
          part.value,
          part.caseSensitive ? "" : "i"
        );
        break;
      }
      case "in":
        fieldOps[fullPath]["$in"] = part.value;
        break;
      case "not_in":
        fieldOps[fullPath]["$nin"] = part.value;
        break;
      case "between": {
        const [min, max] = this.getBetweenValue(part.value, date) || [];
        if (min !== undefined && max !== undefined) {
          if (shouldTreatAsDate) {
            fieldOps[fullPath]["$gte"] = new Date(min);
            fieldOps[fullPath]["$lte"] = new Date(max);
          } else {
            fieldOps[fullPath]["$gte"] = min;
            fieldOps[fullPath]["$lte"] = max;
          }
        }
        break;
      }
      case "exists": {
        fieldOps[fullPath]["$exists"] = part.value;
        break;
      }
    }

    return fieldOps;
  }

  private addFieldOperation(
    fieldOps: Record<string, any>,
    part: IObjPartQueryItem,
    date: Date
  ): void {
    // Check if this value should be treated as a date based on its content
    const shouldTreatAsDate = this.shouldTreatValueAsDate(part.value);

    switch (part.op) {
      case "eq":
        fieldOps["$eq"] = part.value;
        break;
      case "neq":
        fieldOps["$ne"] = part.value;
        break;
      case "gt": {
        const value = shouldTreatAsDate
          ? this.getGtGteValueAsDate(part.value, date)
          : this.getGtGteValue(part.value, date);
        if (value !== undefined) fieldOps["$gt"] = value;
        break;
      }
      case "gte": {
        const value = shouldTreatAsDate
          ? this.getGtGteValueAsDate(part.value, date)
          : this.getGtGteValue(part.value, date);
        if (value !== undefined) fieldOps["$gte"] = value;
        break;
      }
      case "lt": {
        const value = shouldTreatAsDate
          ? this.getLtLteValueAsDate(part.value, date)
          : this.getLtLteValue(part.value, date);
        if (value !== undefined) fieldOps["$lt"] = value;
        break;
      }
      case "lte": {
        const value = shouldTreatAsDate
          ? this.getLtLteValueAsDate(part.value, date)
          : this.getLtLteValue(part.value, date);
        if (value !== undefined) fieldOps["$lte"] = value;
        break;
      }
      case "like": {
        fieldOps["$regex"] = new RegExp(
          part.value,
          part.caseSensitive ? "" : "i"
        );
        break;
      }
      case "in":
        fieldOps["$in"] = part.value;
        break;
      case "not_in":
        fieldOps["$nin"] = part.value;
        break;
      case "between": {
        const [min, max] = this.getBetweenValue(part.value, date) || [];
        if (min !== undefined && max !== undefined) {
          if (shouldTreatAsDate) {
            fieldOps["$gte"] = new Date(min);
            fieldOps["$lte"] = new Date(max);
          } else {
            fieldOps["$gte"] = min;
            fieldOps["$lte"] = max;
          }
        }
        break;
      }
      case "exists": {
        fieldOps["$exists"] = part.value;
        break;
      }
    }
  }

  private shouldTreatValueAsDate(value: any): boolean {
    // If it's already a Date object, treat it as a date
    if (value instanceof Date) {
      return true;
    }

    // If it's a number, check if it looks like a timestamp
    if (typeof value === "number") {
      // If it's a large number (> 1e12), it's likely a timestamp in milliseconds
      // If it's a smaller number, it might be a timestamp in seconds
      return value > 1e12 || (value > 1e9 && value < 1e12);
    }

    // If it's a string, check if it's a valid ISO date string or duration string
    if (typeof value === "string") {
      // Check if it's a duration string (should be treated as date for query purposes)
      if (/^\d+[dhms]$/.test(value)) {
        return true;
      }

      // Check if it's a valid ISO date string
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    return false;
  }
}
