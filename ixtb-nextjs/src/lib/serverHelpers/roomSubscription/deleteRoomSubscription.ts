import {
  db,
  roomSubscriptions as roomSubscriptionTable,
} from "@/src/db/fmlogs-schema";
import { DeleteRoomSubscriptionEndpointArgs } from "@/src/definitions/room";
import { and, eq, SQL } from "drizzle-orm";
import { tryGetRoom } from "../room/getRoom";

export async function deleteRoomSubscription(
  params: DeleteRoomSubscriptionEndpointArgs
) {
  const {
    hashedAuthId,
    acknowledgeDeleteAllForHashedAuthId,
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

  const hasOtherOptionsBesidesRoomId = appId || hashedAuthId || socketId;
  const hasOtherOptionsBesidesHashedAuthId = appId || socketId || roomId;
  const hasOtherOptionsBesidesSocketId = appId || hashedAuthId || roomId;
  const hasOtherOptionsBesidesAppId = hashedAuthId || socketId || roomId;

  const andQueries: SQL[] = [];

  if (roomId && (acknowledgeDeleteAllInRoom || hasOtherOptionsBesidesRoomId)) {
    andQueries.push(eq(roomSubscriptionTable.roomId, roomId));
  }

  if (appId && (acknowledgeDeleteAllForApp || hasOtherOptionsBesidesAppId)) {
    andQueries.push(eq(roomSubscriptionTable.appId, appId));
  }

  if (
    hashedAuthId &&
    (acknowledgeDeleteAllForHashedAuthId || hasOtherOptionsBesidesHashedAuthId)
  ) {
    andQueries.push(eq(roomSubscriptionTable.hashedAuthId, hashedAuthId));
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
