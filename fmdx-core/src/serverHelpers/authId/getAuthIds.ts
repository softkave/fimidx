import { count, eq } from "drizzle-orm";
import { authIds as authIdTable, db } from "../../db/fmdx-schema.js";
import type { GetAuthIdsEndpointArgs } from "../../definitions/webSockets.js";

async function getAuthIdsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
}) {
  const { limitNumber, pageNumber, appId } = params;
  const authIds = await db
    .select()
    .from(authIdTable)
    .where(eq(authIdTable.appId, appId))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return authIds;
}

async function countAuthIdsInDB(params: { appId: string }) {
  const { appId } = params;
  const authIdCount = await db
    .select({ count: count() })
    .from(authIdTable)
    .where(eq(authIdTable.appId, appId));

  return authIdCount[0].count;
}

export async function getAuthIdList(params: GetAuthIdsEndpointArgs) {
  const { page, limit, appId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [authIds, total] = await Promise.all([
    getAuthIdsFromDB({ limitNumber, pageNumber, appId }),
    countAuthIdsInDB({ appId }),
  ]);

  return {
    authIds,
    total,
  };
}
