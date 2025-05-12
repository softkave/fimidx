import { db, hashedAuthIds as hashedAuthIdTable } from "@/src/db/fmlogs-schema";
import { GetHashedAuthIdsEndpointArgs } from "@/src/definitions/websocket";
import { count, eq } from "drizzle-orm";

async function getHashedAuthIdsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
}) {
  const { limitNumber, pageNumber, appId } = params;
  const hashedAuthIds = await db
    .select()
    .from(hashedAuthIdTable)
    .where(eq(hashedAuthIdTable.appId, appId))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return hashedAuthIds;
}

async function countHashedAuthIdsInDB(params: { appId: string }) {
  const { appId } = params;
  const hashedAuthIdCount = await db
    .select({ count: count() })
    .from(hashedAuthIdTable)
    .where(eq(hashedAuthIdTable.appId, appId));

  return hashedAuthIdCount[0].count;
}

export async function getHashedAuthIdList(
  params: GetHashedAuthIdsEndpointArgs
) {
  const { page, limit, appId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [hashedAuthIds, total] = await Promise.all([
    getHashedAuthIdsFromDB({ limitNumber, pageNumber, appId }),
    countHashedAuthIdsInDB({ appId }),
  ]);

  return {
    hashedAuthIds,
    total,
  };
}
