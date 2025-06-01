import assert from "assert";
import { isNumber, set } from "lodash-es";
import type { FilterQuery, SortOrder } from "mongoose";
import { isObjectEmpty } from "softkave-js-utils";
import { getNumberOrDurationMsFromValue } from "../../common/obj.js";
import { objModel } from "../../db/mongo.js";
import type {
  IObj,
  IObjMetaQuery,
  IObjPartLogicalQuery,
  IObjPartQueryItemNumberValue,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
} from "../../definitions/obj.js";

function getGtOrGteValue(params: {
  value: IObjPartQueryItemNumberValue;
  date: Date;
}) {
  const { value, date } = params;
  const { valueNumber: valueNumberFromValue, durationMs } =
    getNumberOrDurationMsFromValue(value);
  let valueNumber: number | undefined;

  if (isNumber(valueNumberFromValue)) {
    valueNumber = valueNumberFromValue;
  } else if (durationMs) {
    valueNumber = new Date(date.getTime() + durationMs).getTime();
  }

  assert(valueNumber, "Invalid value");
  return valueNumber;
}

function getLtOrLteValue(params: {
  value: IObjPartQueryItemNumberValue;
  date: Date;
}) {
  const { value, date } = params;
  const { valueNumber: valueNumberFromValue, durationMs } =
    getNumberOrDurationMsFromValue(value);
  let valueNumber: number | undefined;

  if (isNumber(valueNumberFromValue)) {
    valueNumber = valueNumberFromValue;
  } else if (durationMs) {
    valueNumber = new Date(date.getTime() - durationMs).getTime();
  }

  assert(valueNumber, "Invalid value");
  return valueNumber;
}

function getBetweenValue(params: {
  value: [IObjPartQueryItemNumberValue, IObjPartQueryItemNumberValue];
  date: Date;
}) {
  const { value, date } = params;
  const [min, max] = value;
  const minValue = getGtOrGteValue({ value: min, date });
  const maxValue = getLtOrLteValue({ value: max, date });
  return [minValue, maxValue];
}

function getObjPartFilter(params: {
  prefix: string | undefined;
  partQuery?: IObjPartQueryList;
  date: Date;
}) {
  const { prefix, partQuery, date } = params;

  if (!partQuery) {
    return undefined;
  }

  const pongoQuery: FilterQuery<IObj> = {};
  partQuery.forEach((part) => {
    const field = prefix ? `${prefix}.${part.field}` : part.field;
    switch (part.op) {
      case "eq":
        set(pongoQuery, `${field}.$eq`, part.value);
        break;
      case "neq":
        set(pongoQuery, `${field}.$ne`, part.value);
        break;
      case "gt": {
        const value = getGtOrGteValue({ value: part.value, date });
        set(pongoQuery, `${field}.$gt`, value);
        break;
      }
      case "gte": {
        const value = getGtOrGteValue({ value: part.value, date });
        set(pongoQuery, `${field}.$gte`, value);
        break;
      }
      case "lt": {
        const value = getLtOrLteValue({ value: part.value, date });
        set(pongoQuery, `${field}.$lt`, value);
        break;
      }
      case "lte": {
        const value = getLtOrLteValue({ value: part.value, date });
        set(pongoQuery, `${field}.$lte`, value);
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
        const [min, max] = getBetweenValue({ value: part.value, date });
        set(pongoQuery, `${field}.$gte`, min);
        set(pongoQuery, `${field}.$lte`, max);
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

function getObjPartLogicalQueryFilter(params: {
  logicalQuery?: IObjPartLogicalQuery;
  date: Date;
}) {
  const { logicalQuery, date } = params;

  if (!logicalQuery) {
    return undefined;
  }

  let filter: FilterQuery<IObj> = {};
  if (logicalQuery.and) {
    const andQuery = getObjPartFilter({
      prefix: "objRecord",
      partQuery: logicalQuery.and,
      date,
    });
    if (andQuery && !isObjectEmpty(andQuery)) {
      filter = andQuery;
    }
  }

  if (logicalQuery.or) {
    const orQuery = getObjPartFilter({
      prefix: "objRecord",
      partQuery: logicalQuery.or,
      date,
    });
    if (orQuery && !isObjectEmpty(orQuery)) {
      set(filter, "$or", Object.values(orQuery));
    }
  }

  return filter;
}

function metaQueryToPartQueryList(params: { metaQuery: IObjMetaQuery }) {
  const { metaQuery } = params;
  const partQuery: IObjPartQueryList = [];
  Object.entries(metaQuery).forEach(([key, value]) => {
    Object.keys(value).forEach((op) => {
      const opValue = value[op as keyof typeof value];
      if (!opValue) {
        return;
      }

      switch (op) {
        case "eq":
          partQuery.push({
            op: "eq",
            field: key,
            value: opValue as string | number,
          });
          break;
        case "neq":
          partQuery.push({
            op: "neq",
            field: key,
            value: opValue as string | number,
          });
          break;
        case "in":
          partQuery.push({
            op: "in",
            field: key,
            value: opValue as string[] | number[],
          });
          break;
        case "not_in":
          partQuery.push({
            op: "not_in",
            field: key,
            value: opValue as string[] | number[],
          });
          break;
        case "gt":
          partQuery.push({
            op: "gt",
            field: key,
            value: opValue as string | number,
          });
          break;
        case "gte":
          partQuery.push({
            op: "gte",
            field: key,
            value: opValue as string | number,
          });
          break;
        case "lt":
          partQuery.push({
            op: "lt",
            field: key,
            value: opValue as string | number,
          });
          break;
        case "lte":
          partQuery.push({
            op: "lte",
            field: key,
            value: opValue as string | number,
          });
          break;
        case "between":
          partQuery.push({
            op: "between",
            field: key,
            value: opValue as [string | number, string | number],
          });
          break;
        default:
          throw new Error(`Invalid op: ${op}`);
      }
    });
  });

  return partQuery.length ? partQuery : undefined;
}

function getObjMetaQueryFilter(params: {
  metaQuery?: IObjMetaQuery;
  date: Date;
}) {
  const { metaQuery, date } = params;
  const partQuery = metaQuery
    ? metaQueryToPartQueryList({ metaQuery })
    : undefined;
  return getObjPartFilter({
    prefix: undefined,
    partQuery,
    date,
  });
}

export function getObjQueryFilter(params: {
  objQuery: IObjQuery;
  date: Date;
  tag: string;
  includeDeleted?: boolean;
}) {
  const { objQuery, date, tag, includeDeleted } = params;
  const metaQueryFilter = getObjMetaQueryFilter({
    metaQuery: objQuery.metaQuery,
    date,
  });
  const partQueryFilter = getObjPartLogicalQueryFilter({
    logicalQuery: objQuery.partQuery,
    date,
  });
  const filter: FilterQuery<IObj> = {
    ...metaQueryFilter,
    ...partQueryFilter,
    appId: objQuery.appId,
    tag,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };

  return filter;
}

function objSortToMongooseSort(params: { sort: IObjSortList }) {
  const { sort } = params;
  return sort.map((s) => [s.field, s.direction] as [string, SortOrder]);
}

async function getObjListWithFilter(params: {
  filter: FilterQuery<IObj>;
  sort?: IObjSortList;
  pageNumber: number;
  limitNumber: number;
}) {
  const { filter, sort, pageNumber, limitNumber } = params;
  const mongooseSort = sort
    ? objSortToMongooseSort({ sort })
    : ({ createdAt: "desc" } as const);
  const objs = await objModel
    .find(filter)
    .skip(pageNumber * limitNumber)
    .limit(limitNumber)
    .sort(mongooseSort);
  return objs;
}

async function countObjsWithFilter(params: { filter: FilterQuery<IObj> }) {
  const { filter } = params;
  const count = await objModel.countDocuments(filter);
  return count;
}

export async function getManyObjs(params: {
  objQuery: IObjQuery;
  page?: number;
  limit?: number;
  includeCount?: boolean;
  tag: string;
  sort?: IObjSortList;
  date?: Date;
}) {
  const {
    objQuery,
    page,
    limit,
    includeCount,
    tag,
    sort,
    date: inputDate,
  } = params;
  const date = inputDate ?? new Date();
  const pageNumber = page ?? 0;
  const limitNumber = limit ?? 100;
  const filter = getObjQueryFilter({ objQuery, date, tag });
  const [objs, total] = await Promise.all([
    getObjListWithFilter({
      filter,
      sort,
      pageNumber,
      limitNumber,
    }),
    includeCount ? countObjsWithFilter({ filter }) : Promise.resolve(undefined),
  ]);

  return {
    objs,
    total,
    page: pageNumber,
    limit: limitNumber,
  };
}
