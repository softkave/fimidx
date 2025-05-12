import {
  connectedSockets as connectedSocketTable,
  db,
} from "@/src/db/fmlogs-schema";
import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

async function getConnectedSocketByID(id: string) {
  const [connectedSocket] = await db
    .select()
    .from(connectedSocketTable)
    .where(eq(connectedSocketTable.id, id));
  return connectedSocket;
}

export async function tryGetConnectedSocket(params: { id?: string }) {
  const { id } = params;

  assert(id, new OwnServerError("Invalid request, id is required", 400));

  let connectedSocket: typeof connectedSocketTable.$inferSelect | null = null;

  if (id) {
    connectedSocket = await getConnectedSocketByID(id);
  }

  return connectedSocket;
}

export async function getConnectedSocket(params: { id: string }) {
  const connectedSocket = await tryGetConnectedSocket(params);
  assert(
    connectedSocket,
    new OwnServerError("Connected socket not found", 404)
  );
  return connectedSocket;
}
