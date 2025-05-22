import { and, countDistinct, eq } from "drizzle-orm";
import { db, logParts as logPartsTable } from "../../db/fmdx-schema.js";
import type { GetLogFieldValuesEndpointArgs } from "../../definitions/log.js";

async function getLogFieldValuesFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  orgId: string;
  appId: string;
  fieldName: string;
}) {
  const { limitNumber, pageNumber, appId, fieldName, orgId } = params;

  const apps = await db
    .selectDistinct({ value: logPartsTable.value })
    .from(logPartsTable)
    .where(
      and(
        eq(logPartsTable.appId, appId),
        eq(logPartsTable.name, fieldName),
        eq(logPartsTable.orgId, orgId)
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return apps;
}

async function countLogFieldValuesInDB(params: {
  appId: string;
  fieldName: string;
  orgId: string;
}) {
  const { appId, fieldName, orgId } = params;

  const appCount = await db
    .select({ count: countDistinct(logPartsTable.value) })
    .from(logPartsTable)
    .where(
      and(
        eq(logPartsTable.appId, appId),
        eq(logPartsTable.name, fieldName),
        eq(logPartsTable.orgId, orgId)
      )
    );

  return appCount[0].count;
}

export async function getLogFieldValues(params: {
  args: GetLogFieldValuesEndpointArgs;
  appId: string;
  orgId: string;
}) {
  const { args, appId, orgId } = params;
  const { fieldName, page = 1, limit = 10 } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 100;

  const [values, total] = await Promise.all([
    getLogFieldValuesFromDB({
      appId,
      fieldName,
      limitNumber,
      pageNumber,
      orgId,
    }),
    countLogFieldValuesInDB({ appId, fieldName, orgId }),
  ]);

  return {
    values: values.map((value) => value.value),
    page: pageNumber,
    limit: limitNumber,
    total,
  };
}
