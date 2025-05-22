import {
  connectedWebSockets as connectedWebSocketTable,
  db,
} from "../../db/fmdx-schema.js";

export interface IAddWebSocketArgs {
  orgId: string;
  appId: string;
  authId: string | null;
}

export async function addWebSocket(params: IAddWebSocketArgs) {
  const { orgId, appId, authId } = params;
  const date = new Date();
  const newWebSocket: typeof connectedWebSocketTable.$inferInsert = {
    appId,
    authId,
    createdAt: date,
    updatedAt: date,
    orgId,
  };

  const [webSocket] = await db
    .insert(connectedWebSocketTable)
    .values(newWebSocket)
    .returning();

  return webSocket;
}
