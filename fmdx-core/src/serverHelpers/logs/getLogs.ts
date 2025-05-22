import assert from "assert";
import {
  and,
  between,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  like,
  lt,
  lte,
  ne,
  notInArray,
  or,
  SQL,
} from "drizzle-orm";
import { groupBy, isNumber } from "lodash-es";
import {
  db,
  logParts as logPartsTable,
  logs as logsTable,
} from "../../db/fmdx-schema.js";
import type {
  GetLogsEndpointArgs,
  LogPartFilterItem,
} from "../../definitions/log.js";
import {
  type DurationApplication,
  kDurationApplication,
  kDurationUnits,
  kDurationUnitsToMs,
} from "../../definitions/other.js";

/**
 * Converts filter values to normalized numbers, handling duration units and time calculations
 * @param params.f - The filter item containing value and operation
 * @param params.date - Reference date for time calculations
 * @param params.application - How to apply the duration (before/after)
 * @param params.invalidError - Custom error message for invalid values
 * @returns Normalized number value in milliseconds
 */
function getNumberValue(params: {
  f: LogPartFilterItem;
  date: Date;
  application?: DurationApplication;
  invalidError?: string;
}) {
  const { f, date, application: inputApplication, invalidError } = params;

  // Validate input value exists
  if (!f.value || f.value.length === 0) {
    throw new Error("Value array must not be empty");
  }

  let valueNumber = Number(f.value[0]);
  assert(
    isNumber(valueNumber) && !Number.isNaN(valueNumber),
    invalidError ?? "Value must be a number"
  );

  const unit = f.value[1];
  if (unit) {
    switch (unit) {
      case kDurationUnits.seconds:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      case kDurationUnits.minutes:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      case kDurationUnits.hours:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      case kDurationUnits.days:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      case kDurationUnits.weeks:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      case kDurationUnits.months:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      case kDurationUnits.years:
        valueNumber = valueNumber * kDurationUnitsToMs[unit];
        break;
      default:
        assert(false, `Unknown unit: ${unit}`);
    }

    const application = inputApplication ?? kDurationApplication.after;
    if (application === kDurationApplication.after) {
      valueNumber = date.getTime() + valueNumber;
    } else {
      valueNumber = date.getTime() - valueNumber;
    }
  }

  return valueNumber;
}

/**
 * Builds a Drizzle ORM query for filtering log parts based on provided criteria
 * @param params.args - Filter arguments from the API endpoint
 * @returns SQL query condition or undefined if no filters
 */
export function getLogIdsFromPartsQuery(params: { args: GetLogsEndpointArgs }) {
  const { args } = params;
  const { filter } = args;

  if (!filter) {
    return undefined;
  }

  const date = new Date();
  const query = or(
    ...filter.map((f) => {
      switch (f.op) {
        case "eq":
          return and(
            eq(logPartsTable.value, f.value[0]),
            eq(logPartsTable.name, f.name)
          );
        case "neq":
          return and(
            ne(logPartsTable.value, f.value[0]),
            eq(logPartsTable.name, f.name)
          );
        case "gt":
          const valueNumber = getNumberValue({
            f,
            date,
            application: kDurationApplication.before,
            invalidError: "gt must have a number value",
          });
          return and(
            gt(logPartsTable.valueNumber, valueNumber),
            eq(logPartsTable.name, f.name)
          );
        case "gte":
          const valueNumber2 = getNumberValue({
            f,
            date,
            application: kDurationApplication.before,
            invalidError: "gte must have a number value",
          });
          return and(
            gte(logPartsTable.valueNumber, valueNumber2),
            eq(logPartsTable.name, f.name)
          );
        case "lt":
          const valueNumber3 = getNumberValue({
            f,
            date,
            application: kDurationApplication.after,
            invalidError: "lt must have a number value",
          });
          return and(
            lt(logPartsTable.valueNumber, valueNumber3),
            eq(logPartsTable.name, f.name)
          );
        case "lte":
          const valueNumber4 = getNumberValue({
            f,
            date,
            application: kDurationApplication.after,
            invalidError: "lte must have a number value",
          });
          return and(
            lte(logPartsTable.valueNumber, valueNumber4),
            eq(logPartsTable.name, f.name)
          );
        case "like":
          assert(f.value.length === 1, "like must have 1 value");
          const valueLike = f.value[0];
          assert(valueLike.length > 0, "like must have a non-empty value");
          return and(
            like(logPartsTable.value, valueLike),
            eq(logPartsTable.name, f.name)
          );
        case "ilike":
          assert(f.value.length === 1, "ilike must have 1 value");
          const valueIlike = f.value[0];
          assert(valueIlike.length > 0, "ilike must have a non-empty value");
          return and(
            ilike(logPartsTable.value, valueIlike),
            eq(logPartsTable.name, f.name)
          );
        case "in":
          assert(f.value.length > 0, "in must have at least 1 value");
          return and(
            inArray(logPartsTable.value, f.value),
            eq(logPartsTable.name, f.name)
          );
        case "not_in":
          assert(f.value.length > 0, "not_in must have at least 1 value");
          return and(
            notInArray(logPartsTable.value, f.value),
            eq(logPartsTable.name, f.name)
          );
        case "between":
          assert(f.value.length >= 2, "between must have 2 values");
          const valueNumber5 = Number(f.value[0]);
          const valueNumber6 = Number(f.value[1]);
          assert(isNumber(valueNumber5), "between must have a number value");
          assert(isNumber(valueNumber6), "between must have a number value");
          return and(
            between(logPartsTable.valueNumber, valueNumber5, valueNumber6),
            eq(logPartsTable.name, f.name)
          );
        default:
          return undefined;
      }
    })
  );

  return query;
}

async function getLogPartsWithQuery(params: {
  query: SQL<unknown> | undefined;
  limitNumber: number;
  pageNumber: number;
}) {
  const { query, limitNumber, pageNumber } = params;
  if (!query) {
    return [];
  }

  const logParts = await db
    .select({ logId: logPartsTable.logId })
    .from(logPartsTable)
    .where(query)
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber)
    .orderBy(desc(logPartsTable.createdAt));

  return logParts;
}

export async function getLogIdsFromParts(params: {
  args: GetLogsEndpointArgs;
  appId: string;
  orgId: string;
  pageNumber: number;
  limitNumber: number;
}) {
  const { args, appId, orgId, pageNumber, limitNumber } = params;

  // TODO: we'll need a more performant way to do this

  const query = getLogIdsFromPartsQuery({ args });
  if (!query) {
    return {
      logIds: [],
      hasMore: false,
    };
  }

  const finalQuery = and(
    eq(logPartsTable.appId, appId),
    eq(logPartsTable.orgId, orgId),
    query
  );

  const [logParts, next1LogPart] = await Promise.all([
    getLogPartsWithQuery({
      query: finalQuery,
      limitNumber,
      pageNumber,
    }),
    getLogPartsWithQuery({
      query: finalQuery,
      limitNumber: 1,
      pageNumber: pageNumber + 1,
    }),
  ]);

  const logIds = logParts.map((logPart) => logPart.logId);
  const hasMore = next1LogPart.length > 0;

  return {
    logIds,
    hasMore,
  };
}

async function getLogsFromDb(params: {
  appId: string;
  orgId: string;
  logIds?: string[];
  pageNumber: number;
  limitNumber: number;
}) {
  const { appId, orgId, logIds, pageNumber, limitNumber } = params;

  if (logIds && logIds.length === 0) {
    return [];
  }

  const logs = await db
    .select()
    .from(logsTable)
    .where(
      and(
        eq(logsTable.appId, appId),
        eq(logsTable.orgId, orgId),
        logIds ? inArray(logsTable.id, logIds) : undefined
      )
    )
    .orderBy(desc(logsTable.createdAt))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return logs;
}

async function countLogsInDb(params: { appId: string; orgId: string }) {
  const { appId, orgId } = params;
  const logCount = await db
    .select({ count: count() })
    .from(logsTable)
    .where(and(eq(logsTable.appId, appId), eq(logsTable.orgId, orgId)));

  return logCount[0].count;
}

async function getLogPartsFromDb(params: { logIds: string[] }) {
  const { logIds } = params;
  const logParts = await db
    .select()
    .from(logPartsTable)
    .where(inArray(logPartsTable.logId, logIds));

  return logParts;
}

/**
 * Main function to retrieve logs with their associated parts
 * Supports filtering, pagination and includes total count
 * @param params.args - API endpoint arguments including filters and pagination
 * @param params.appId - Application identifier
 * @param params.orgId - Organization identifier
 * @returns Paginated logs with their parts and metadata
 */
export async function getLogs(params: {
  args: GetLogsEndpointArgs;
  appId: string;
  orgId: string;
}) {
  const { args, appId, orgId } = params;
  const { logIds: inputLogIds, page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 100;

  let logIdsToFetch = inputLogIds;
  const { logIds: logIdsFromParts, hasMore } = await getLogIdsFromParts({
    args,
    appId,
    orgId,
    pageNumber,
    limitNumber,
  });

  if (logIdsFromParts) {
    logIdsToFetch = (logIdsToFetch ?? []).concat(logIdsFromParts);
  }

  const logs = await getLogsFromDb({
    appId,
    orgId,
    logIds: logIdsToFetch,
    pageNumber,
    limitNumber,
  });

  const fetchedLogIds = logs.map((log) => log.id);
  const [logParts, logCount] = await Promise.all([
    getLogPartsFromDb({ logIds: fetchedLogIds }),
    logIdsFromParts ? null : countLogsInDb({ appId, orgId }),
  ]);

  const logPartsMap = groupBy(logParts, (logPart) => logPart.logId);
  const logsWithParts = logs.map((log) => ({
    ...log,
    parts: logPartsMap[log.id] ?? [],
  }));

  return {
    logs: logsWithParts,
    page: pageNumber,
    limit: limitNumber,
    total: logCount,
    hasMore,
  };
}
