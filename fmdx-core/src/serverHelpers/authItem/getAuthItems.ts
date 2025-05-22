import { and, count, eq } from "drizzle-orm";
import {
  connectedAuthItems as connectedAuthItemTable,
  db,
} from "../../db/fmdx-schema.js";
import type { GetAuthItemsEndpointArgs } from "../../definitions/webSockets.js";

async function getAuthItemsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  authId?: string;
}) {
  const { limitNumber, pageNumber, appId, authId } = params;
  const rooms = await db
    .select()
    .from(connectedAuthItemTable)
    .where(
      and(
        eq(connectedAuthItemTable.appId, appId),
        authId ? eq(connectedAuthItemTable.authId, authId) : undefined
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return rooms;
}

async function countAuthItemsInDB(params: { appId: string; authId?: string }) {
  const { appId, authId } = params;
  const authItemCount = await db
    .select({ count: count() })
    .from(connectedAuthItemTable)
    .where(
      and(
        eq(connectedAuthItemTable.appId, appId),
        authId ? eq(connectedAuthItemTable.authId, authId) : undefined
      )
    );

  return authItemCount[0].count;
}

export async function getAuthItemList(params: GetAuthItemsEndpointArgs) {
  const { page, limit, appId, authId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [authItems, total] = await Promise.all([
    getAuthItemsFromDB({ limitNumber, pageNumber, appId, authId }),
    countAuthItemsInDB({ appId, authId }),
  ]);

  return {
    authItems,
    total,
  };
}

export async function getAllAuthItemsForAuthId(params: {
  appId: string;
  authId: string;
}) {
  const { appId, authId } = params;
  const authItems = await db
    .select()
    .from(connectedAuthItemTable)
    .where(
      and(
        eq(connectedAuthItemTable.appId, appId),
        eq(connectedAuthItemTable.authId, authId)
      )
    );

  return authItems;
}
