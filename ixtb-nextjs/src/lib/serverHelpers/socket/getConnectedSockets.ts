import {
  connectedSockets as connectedSocketTable,
  db,
} from "@/src/db/fmlogs-schema";
import { GetConnectedSocketsEndpointArgs } from "@/src/definitions/websocket";
import { and, count, eq } from "drizzle-orm";

async function getConnectedSocketsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  hashedAuthId?: string;
}) {
  const { limitNumber, pageNumber, appId, hashedAuthId } = params;
  const rooms = await db
    .select()
    .from(connectedSocketTable)
    .where(
      and(
        eq(connectedSocketTable.appId, appId),
        hashedAuthId
          ? eq(connectedSocketTable.hashedAuthId, hashedAuthId)
          : undefined
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return rooms;
}

async function countConnectedSocketsInDB(params: {
  appId: string;
  hashedAuthId?: string;
}) {
  const { appId, hashedAuthId } = params;
  const connectedSocketCount = await db
    .select({ count: count() })
    .from(connectedSocketTable)
    .where(
      and(
        eq(connectedSocketTable.appId, appId),
        hashedAuthId
          ? eq(connectedSocketTable.hashedAuthId, hashedAuthId)
          : undefined
      )
    );

  return connectedSocketCount[0].count;
}

export async function getConnectedSocketList(
  params: GetConnectedSocketsEndpointArgs
) {
  const { page, limit, appId, hashedAuthId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [connectedSockets, total] = await Promise.all([
    getConnectedSocketsFromDB({ limitNumber, pageNumber, appId, hashedAuthId }),
    countConnectedSocketsInDB({ appId, hashedAuthId }),
  ]);

  return {
    connectedSockets,
    total,
  };
}
