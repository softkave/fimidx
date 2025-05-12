import {
  connectedAuthItems as connectedAuthItemTable,
  db,
} from "@/src/db/fmlogs-schema";
import { GetAuthItemsEndpointArgs } from "@/src/definitions/websocket";
import { and, count, eq } from "drizzle-orm";

async function getAuthItemsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  hashedAuthId?: string;
}) {
  const { limitNumber, pageNumber, appId, hashedAuthId } = params;
  const rooms = await db
    .select()
    .from(connectedAuthItemTable)
    .where(
      and(
        eq(connectedAuthItemTable.appId, appId),
        hashedAuthId
          ? eq(connectedAuthItemTable.hashedAuthId, hashedAuthId)
          : undefined
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return rooms;
}

async function countAuthItemsInDB(params: {
  appId: string;
  hashedAuthId?: string;
}) {
  const { appId, hashedAuthId } = params;
  const authItemCount = await db
    .select({ count: count() })
    .from(connectedAuthItemTable)
    .where(
      and(
        eq(connectedAuthItemTable.appId, appId),
        hashedAuthId
          ? eq(connectedAuthItemTable.hashedAuthId, hashedAuthId)
          : undefined
      )
    );

  return authItemCount[0].count;
}

export async function getAuthItemList(params: GetAuthItemsEndpointArgs) {
  const { page, limit, appId, hashedAuthId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [authItems, total] = await Promise.all([
    getAuthItemsFromDB({ limitNumber, pageNumber, appId, hashedAuthId }),
    countAuthItemsInDB({ appId, hashedAuthId }),
  ]);

  return {
    authItems,
    total,
  };
}
