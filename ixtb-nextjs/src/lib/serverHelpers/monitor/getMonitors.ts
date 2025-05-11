import { db, monitor as monitorTable } from "@/src/db/fmlogs-schema";
import { GetMonitorsEndpointArgs } from "@/src/definitions/monitor";
import { and, count, eq } from "drizzle-orm";

async function getMonitorsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  orgId: string;
}) {
  const { limitNumber, pageNumber, appId, orgId } = params;
  const monitors = await db
    .select()
    .from(monitorTable)
    .where(and(eq(monitorTable.appId, appId), eq(monitorTable.orgId, orgId)))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return monitors;
}

async function countMonitorsInDB(params: { appId: string; orgId: string }) {
  const { appId, orgId } = params;
  const tokenCount = await db
    .select({ count: count() })
    .from(monitorTable)
    .where(and(eq(monitorTable.appId, appId), eq(monitorTable.orgId, orgId)));

  return tokenCount[0].count;
}

export async function getMonitorList(params: {
  args: GetMonitorsEndpointArgs;
  appId: string;
  orgId: string;
}) {
  const { args, appId, orgId } = params;
  const { page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [monitors, total] = await Promise.all([
    getMonitorsFromDB({ limitNumber, pageNumber, appId, orgId }),
    countMonitorsInDB({ appId, orgId }),
  ]);

  return {
    monitors,
    total,
  };
}
