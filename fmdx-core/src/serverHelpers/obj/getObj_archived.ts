import assert from "assert";
import {
  and,
  between,
  desc,
  eq,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  ne,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { isNumber } from "lodash-es";
import { getNumberOrDurationMsFromValue } from "../../common/obj.js";
import { db, objParts as objPartsTable } from "../../db/fmdx-schema.js";
import type {
  IObjPartLogicalQuery,
  IObjPartQueryItemNumberValue,
  IObjPartQueryList,
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

function getObjPartQuerySQL(params: {
  partQuery?: IObjPartQueryList;
  date: Date;
}) {
  const { partQuery, date } = params;

  if (!partQuery) {
    return undefined;
  }

  const queryList: SQL<unknown>[] = [];
  partQuery.forEach((part) => {
    switch (part.op) {
      case "eq":
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            eq(objPartsTable.value, part.value)
          ) as SQL<unknown>
        );
        break;
      case "neq":
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            ne(objPartsTable.value, part.value)
          ) as SQL<unknown>
        );
        break;
      case "gt": {
        const value = getGtOrGteValue({ value: part.value, date });
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            gt(objPartsTable.valueNumber, value)
          ) as SQL<unknown>
        );
        break;
      }
      case "gte":
        const value = getGtOrGteValue({ value: part.value, date });
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            gte(objPartsTable.valueNumber, value)
          ) as SQL<unknown>
        );
        break;
      case "lt": {
        const value = getLtOrLteValue({ value: part.value, date });
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            lt(objPartsTable.valueNumber, value)
          ) as SQL<unknown>
        );
        break;
      }
      case "lte": {
        const value = getLtOrLteValue({ value: part.value, date });
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            lte(objPartsTable.valueNumber, value)
          ) as SQL<unknown>
        );
        break;
      }
      case "like": {
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            like(objPartsTable.value, part.value)
          ) as SQL<unknown>
        );
        break;
      }
      // case "ilike": {
      //   queryList.push(
      //     and(
      //       eq(objPartsTable.field, part.field),
      //       ilike(objPartsTable.value, part.value)
      //     ) as SQL<unknown>
      //   );
      //   break;
      // }
      case "in": {
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            inArray(objPartsTable.value, part.value)
          ) as SQL<unknown>
        );
        break;
      }
      case "not_in": {
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            notInArray(objPartsTable.value, part.value)
          ) as SQL<unknown>
        );
        break;
      }
      case "between": {
        const [min, max] = getBetweenValue({ value: part.value, date });
        queryList.push(
          and(
            eq(objPartsTable.field, part.field),
            between(objPartsTable.valueNumber, min, max)
          ) as SQL<unknown>
        );
        break;
      }
    }
  });

  return queryList;
}

function getObjPartLogicalQuerySQL(params: {
  logicalQuery?: IObjPartLogicalQuery;
  date: Date;
}) {
  const { logicalQuery, date } = params;

  if (!logicalQuery) {
    return undefined;
  }

  const queryList: SQL<unknown>[] = [];
  if (logicalQuery.and) {
    const andQuery = getObjPartQuerySQL({
      partQuery: logicalQuery.and,
      date,
    });
    if (andQuery?.length) {
      queryList.push(and(...andQuery) as SQL<unknown>);
    }
  }
  if (logicalQuery.or) {
    const orQuery = getObjPartQuerySQL({
      partQuery: logicalQuery.or,
      date,
    });
    if (orQuery?.length) {
      queryList.push(or(...orQuery) as SQL<unknown>);
    }
  }

  return queryList.length ? queryList : undefined;
}

// function getObjPartLogicalQueryWithNotSQL(params: {
//   appId: string;
//   logicalQueryWithNot?: IObjPartLogicalQueryWithNot;
//   date: Date;
// }) {
//   const { appId, logicalQueryWithNot, date } = params;

//   if (!logicalQueryWithNot) {
//     return undefined;
//   }

//   if (logicalQueryWithNot.not) {
//     const notQuery = getObjPartLogicalQuerySQL({
//       logicalQuery: logicalQueryWithNot.not,
//       date,
//     });
//     if (notQuery?.length) {
//       return not(
//         notQuery.length === 1 ? notQuery[0] : (and(...notQuery) as SQL<unknown>)
//       ) as SQL<unknown>;
//     }
//   } else {
//     return getObjPartLogicalQuerySQL({
//       logicalQuery: logicalQueryWithNot,
//       date,
//     });
//   }

//   return undefined;
// }

export async function getObjPartsWithSQL(params: {
  appId: string;
  query: SQL<unknown> | undefined;
  limitNumber: number;
  pageNumber: number;
}) {
  const { appId, query, limitNumber, pageNumber } = params;

  if (!query) {
    return [];
  }

  const objParts = await db
    .select({ objId: objPartsTable.objId })
    .from(objPartsTable)
    .where(and(query, eq(objPartsTable.appId, appId)))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber)
    .orderBy(desc(objPartsTable.createdAt));

  return objParts;
}
