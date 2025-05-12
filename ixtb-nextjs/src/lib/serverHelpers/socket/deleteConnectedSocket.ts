import {
  connectedSockets as connectedSocketTable,
  db,
} from "@/src/db/fmlogs-schema";
import { DisconnectSocketEndpointArgs } from "@/src/definitions/websocket";
import { and, eq, SQL } from "drizzle-orm";

export async function deleteConnectedSocket(
  params: DisconnectSocketEndpointArgs
) {
  const {
    socketId,
    acknowledgeDisconnectAllForHashedAuthId,
    acknowledgeDisconnectAllInApp,
    appId,
    hashedAuthId,
  } = params;

  let query: SQL | undefined;

  if (socketId) {
    query = eq(connectedSocketTable.socketId, socketId);
  } else if (hashedAuthId && appId && acknowledgeDisconnectAllForHashedAuthId) {
    query = and(
      eq(connectedSocketTable.hashedAuthId, hashedAuthId),
      eq(connectedSocketTable.appId, appId)
    );
  } else if (appId && acknowledgeDisconnectAllInApp) {
    query = eq(connectedSocketTable.appId, appId);
  }

  if (query) {
    await db.delete(connectedSocketTable).where(query);
  }
}
