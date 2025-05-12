import {
  db,
  roomSubscriptions as roomSubscriptionsTable,
} from "@/src/db/fmlogs-schema";
import { AddRoomSubscriptionEndpointArgs } from "@/src/definitions/room";
import { getRoom } from "../room/getRoom";
import { getRoomSubscriptions } from "./getRoomSubscriptions";

export async function addRoomSubscription(params: {
  args: AddRoomSubscriptionEndpointArgs;
  orgId: string;
}) {
  const { args, orgId } = params;
  const { roomId, appId, roomName, socketId, hashedAuthId } = args;

  const {
    roomSubscriptions: [existingRoomSubscription],
  } = await getRoomSubscriptions({
    roomId,
    appId,
    roomName,
    socketId,
    hashedAuthId,
    limit: 1,
  });

  if (!existingRoomSubscription) {
    const room = await getRoom({ id: roomId, name: roomName, appId });

    const date = new Date();
    const newRoomSubscription: typeof roomSubscriptionsTable.$inferInsert = {
      roomId: room.id,
      socketId,
      hashedAuthId,
      createdAt: date,
      updatedAt: date,
      orgId,
      appId: room.appId,
    };

    const [roomSubscription] = await db
      .insert(roomSubscriptionsTable)
      .values(newRoomSubscription)
      .returning();

    return roomSubscription;
  }
}
