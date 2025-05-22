import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { db, rooms as roomTable } from "../../db/fmdx-schema.js";
import type { GetRoomEndpointArgs } from "../../definitions/room.js";

async function getRoomByID(id: string) {
  const [room] = await db.select().from(roomTable).where(eq(roomTable.id, id));
  return room;
}

async function getRoomByName(name: string, appId: string) {
  const [room] = await db
    .select()
    .from(roomTable)
    .where(
      and(
        eq(roomTable.nameLower, name.toLowerCase()),
        eq(roomTable.appId, appId)
      )
    );
  return room;
}

export async function tryGetRoom(params: GetRoomEndpointArgs) {
  const { id, name, appId } = params;

  assert(
    id || (name && appId),
    new OwnServerError(
      "Invalid request, id or (name and appId) is required",
      400
    )
  );

  let room: typeof roomTable.$inferSelect | null = null;

  if (id) {
    room = await getRoomByID(id);
  } else if (name && appId) {
    room = await getRoomByName(name, appId);
  }

  return room;
}

export async function getRoom(params: GetRoomEndpointArgs) {
  const room = await tryGetRoom(params);
  assert(room, new OwnServerError("Room not found", 404));
  return room;
}
