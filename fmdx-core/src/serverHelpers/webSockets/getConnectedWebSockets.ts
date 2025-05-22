import { and, count, eq } from "drizzle-orm";
import {
  connectedWebSockets as connectedWebSocketTable,
  db,
} from "../../db/fmdx-schema.js";
import type {
  GetConnectedWebSocketsEndpointArgs,
  IConnectedWebSocket,
} from "../../definitions/webSockets.js";

async function getConnectedWebSocketsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  authId?: string;
}) {
  const { limitNumber, pageNumber, appId, authId } = params;
  const rooms = await db
    .select()
    .from(connectedWebSocketTable)
    .where(
      and(
        eq(connectedWebSocketTable.appId, appId),
        authId ? eq(connectedWebSocketTable.authId, authId) : undefined
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return rooms;
}

async function countConnectedWebSocketsInDB(params: {
  appId: string;
  authId?: string;
}) {
  const { appId, authId } = params;
  const connectedWebSocketCount = await db
    .select({ count: count() })
    .from(connectedWebSocketTable)
    .where(
      and(
        eq(connectedWebSocketTable.appId, appId),
        authId ? eq(connectedWebSocketTable.authId, authId) : undefined
      )
    );

  return connectedWebSocketCount[0].count;
}

export async function getConnectedWebSocketList(
  params: GetConnectedWebSocketsEndpointArgs
): Promise<{
  connectedWebSockets: IConnectedWebSocket[];
  total: number;
}> {
  const { page, limit, appId, authId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [connectedWebSockets, total] = await Promise.all([
    getConnectedWebSocketsFromDB({ limitNumber, pageNumber, appId, authId }),
    countConnectedWebSocketsInDB({ appId, authId }),
  ]);

  return {
    connectedWebSockets,
    total,
  };
}
