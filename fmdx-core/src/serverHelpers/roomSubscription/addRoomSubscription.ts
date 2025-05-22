import assert from "assert";
import { OwnServerError } from "../../common/error.js";
import {
  db,
  roomSubscriptions as roomSubscriptionsTable,
} from "../../db/fmdx-schema.js";
import type {
  AddRoomSubscriptionEndpointArgs,
  IRoom,
} from "../../definitions/index.js";
import { getRoom } from "../room/getRoom.js";
import { getRoomSubscriptions } from "./getRoomSubscriptions.js";

export async function addRoomSubscription(params: {
  args: AddRoomSubscriptionEndpointArgs;
  orgId: string;
  clientTokenId: string | null;
  existingRoom?: IRoom | null;
}) {
  const { args, orgId, clientTokenId, existingRoom } = params;
  const { roomId, appId, roomName, socketId, authId } = args;

  const {
    roomSubscriptions: [existingRoomSubscription],
  } = await getRoomSubscriptions({
    roomId,
    appId,
    roomName,
    socketId,
    authId,
    limit: 1,
  });

  if (!existingRoomSubscription) {
    assert(
      socketId || authId,
      new OwnServerError("Socket or authId is required", 400)
    );

    const room =
      existingRoom ?? (await getRoom({ id: roomId, name: roomName, appId }));

    const date = new Date();
    const newRoomSubscription: typeof roomSubscriptionsTable.$inferInsert = {
      roomId: room.id,
      socketId,
      authId,
      createdAt: date,
      updatedAt: date,
      orgId,
      appId: room.appId,
      clientTokenId,
    };

    const [roomSubscription] = await db
      .insert(roomSubscriptionsTable)
      .values(newRoomSubscription)
      .returning();

    return roomSubscription;
  }

  return existingRoomSubscription;
}
