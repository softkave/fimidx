import { and, eq, SQL } from "drizzle-orm";
import {
  connectedWebSockets as connectedWebSocketTable,
  db,
} from "../../db/fmdx-schema.js";
import type { DisconnectWebSocketEndpointArgs } from "../../definitions/webSockets.js";

export async function deleteConnectedWebSocket(
  params: DisconnectWebSocketEndpointArgs
) {
  const {
    id,
    acknowledgeDisconnectAllForAuthId,
    acknowledgeDisconnectAllInApp,
    appId,
    authId,
  } = params;

  let query: SQL | undefined;

  if (id) {
    query = eq(connectedWebSocketTable.id, id);
  } else if (authId && appId && acknowledgeDisconnectAllForAuthId) {
    query = and(
      eq(connectedWebSocketTable.authId, authId),
      eq(connectedWebSocketTable.appId, appId)
    );
  } else if (appId && acknowledgeDisconnectAllInApp) {
    query = eq(connectedWebSocketTable.appId, appId);
  }

  if (query) {
    await db.delete(connectedWebSocketTable).where(query);
  }
}
