import { eq } from "drizzle-orm";
import { db, rooms as roomTable } from "../../db/fmdx-schema.js";
import type { DeleteRoomEndpointArgs } from "../../definitions/room.js";
import { tryGetRoom } from "./getRoom.js";

export async function deleteRoom(params: DeleteRoomEndpointArgs) {
  const { id, acknowledgeDeleteAllInApp, appId, name } = params;

  if (id || (name && appId)) {
    const room = await tryGetRoom({ id, name, appId });
    if (room) {
      await db.delete(roomTable).where(eq(roomTable.id, room.id));
    }
  } else if (appId && acknowledgeDeleteAllInApp) {
    await db.delete(roomTable).where(eq(roomTable.appId, appId));
  }
}
