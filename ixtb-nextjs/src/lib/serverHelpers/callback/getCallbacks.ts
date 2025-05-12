import { callbacks as callbackTable, db } from "@/src/db/fmlogs-schema";
import { GetCallbacksEndpointArgs } from "@/src/definitions/callback";
import { and, count, eq } from "drizzle-orm";

async function getCallbacksFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  orgId: string;
}) {
  const { limitNumber, pageNumber, appId, orgId } = params;
  const callbacks = await db
    .select()
    .from(callbackTable)
    .where(and(eq(callbackTable.appId, appId), eq(callbackTable.orgId, orgId)))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return callbacks;
}

async function countCallbacksInDB(params: { appId: string; orgId: string }) {
  const { appId, orgId } = params;
  const callbackCount = await db
    .select({ count: count() })
    .from(callbackTable)
    .where(and(eq(callbackTable.appId, appId), eq(callbackTable.orgId, orgId)));

  return callbackCount[0].count;
}

export async function getCallbackList(params: {
  args: GetCallbacksEndpointArgs;
  appId: string;
  orgId: string;
}) {
  const { args, appId, orgId } = params;
  const { page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [callbacks, total] = await Promise.all([
    getCallbacksFromDB({ limitNumber, pageNumber, appId, orgId }),
    countCallbacksInDB({ appId, orgId }),
  ]);

  return {
    callbacks,
    total,
  };
}
