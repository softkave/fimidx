import { count, eq } from "drizzle-orm";
import { apps as appsTable, db } from "../../db/fmdx-schema.js";
import type { GetAppsEndpointArgs } from "../../definitions/app.js";

async function getAppsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  orgId: string;
}) {
  const { limitNumber, pageNumber, orgId } = params;

  const apps = await db
    .select()
    .from(appsTable)
    .where(eq(appsTable.orgId, orgId))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return apps;
}

async function countAppsInDB(params: { orgId: string }) {
  const { orgId } = params;

  const appCount = await db
    .select({ count: count() })
    .from(appsTable)
    .where(eq(appsTable.orgId, orgId));

  return appCount[0].count;
}

export async function getAppList(params: {
  args: GetAppsEndpointArgs;
  orgId: string;
}) {
  const { args, orgId } = params;
  const { page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [apps, total] = await Promise.all([
    getAppsFromDB({ limitNumber, pageNumber, orgId }),
    countAppsInDB({ orgId }),
  ]);

  return {
    apps,
    total,
  };
}
