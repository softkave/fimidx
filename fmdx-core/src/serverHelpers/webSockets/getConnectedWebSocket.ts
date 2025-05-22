import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import {
  connectedWebSockets as connectedWebSocketTable,
  db,
} from "../../db/fmdx-schema.js";

async function getConnectedWebSocketByID(id: string) {
  const [connectedWebSocket] = await db
    .select()
    .from(connectedWebSocketTable)
    .where(eq(connectedWebSocketTable.id, id));
  return connectedWebSocket;
}

async function getConnectedWebSocketByAuthId(authId: string) {
  const [connectedWebSocket] = await db
    .select()
    .from(connectedWebSocketTable)
    .where(eq(connectedWebSocketTable.authId, authId));
  return connectedWebSocket;
}

export async function tryGetConnectedWebSocket(params: {
  id?: string;
  authId?: string;
}) {
  const { id, authId } = params;
  assert(
    id || authId,
    new OwnServerError("Invalid request, id or authId is required", 400)
  );

  let connectedWebSocket: typeof connectedWebSocketTable.$inferSelect | null =
    null;

  if (id) {
    connectedWebSocket = await getConnectedWebSocketByID(id);
  } else if (authId) {
    connectedWebSocket = await getConnectedWebSocketByAuthId(authId);
  }

  return connectedWebSocket;
}

export async function getConnectedWebSocket(params: {
  id?: string;
  authId?: string;
}) {
  const connectedWebSocket = await tryGetConnectedWebSocket(params);
  assert(
    connectedWebSocket,
    new OwnServerError("Connected web socket not found", 404)
  );

  return connectedWebSocket;
}
