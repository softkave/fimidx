import { and, eq, SQL } from "drizzle-orm";
import {
  db,
  roomSubscriptions as roomSubscriptionTable,
} from "../../db/fmdx-schema.js";
import type { DeleteRoomSubscriptionEndpointArgs } from "../../definitions/room.js";
import { tryGetRoom } from "../room/getRoom.js";

export async function deleteRoomSubscription(
  params: DeleteRoomSubscriptionEndpointArgs
) {
  const {
    authId,
    acknowledgeDeleteAllForAuthId,
    appId,
    acknowledgeDeleteAllForApp,
    socketId,
    acknowledgeDeleteAllForSocketId,
    roomId: initialRoomId,
    roomName,
    acknowledgeDeleteAllInRoom,
  } = params;

  let roomId = initialRoomId;
  if (roomName) {
    const room = await tryGetRoom({ name: roomName, appId });
    if (room) {
      roomId = room.id;
    }
  }

  const hasOtherOptionsBesidesRoomId = appId || authId || socketId;
  const hasOtherOptionsBesidesAuthId = appId || socketId || roomId;
  const hasOtherOptionsBesidesSocketId = appId || authId || roomId;
  const hasOtherOptionsBesidesAppId = authId || socketId || roomId;

  const andQueries: SQL[] = [];

  if (roomId && (acknowledgeDeleteAllInRoom || hasOtherOptionsBesidesRoomId)) {
    andQueries.push(eq(roomSubscriptionTable.roomId, roomId));
  }

  if (appId && (acknowledgeDeleteAllForApp || hasOtherOptionsBesidesAppId)) {
    andQueries.push(eq(roomSubscriptionTable.appId, appId));
  }

  if (
    authId &&
    (acknowledgeDeleteAllForAuthId || hasOtherOptionsBesidesAuthId)
  ) {
    andQueries.push(eq(roomSubscriptionTable.authId, authId));
  }

  if (
    socketId &&
    (acknowledgeDeleteAllForSocketId || hasOtherOptionsBesidesSocketId)
  ) {
    andQueries.push(eq(roomSubscriptionTable.socketId, socketId));
  }

  if (andQueries.length > 0) {
    await db.delete(roomSubscriptionTable).where(and(...andQueries));
  }
}
