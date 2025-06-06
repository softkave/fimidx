import {
  addRoomSubscriptionSchema,
  IAddRoomSubscriptionEndpointResponse,
} from "fmdx-core/definitions/index";
import {
  addRoomSubscription,
  checkClientTokenRoomAccess,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const addRoomSubscriptionEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddRoomSubscriptionEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = addRoomSubscriptionSchema.parse(await req.json());

  const { room } = await checkClientTokenRoomAccess({
    input: {
      roomId: input.roomId,
      appId: input.appId,
      roomName: input.roomName,
      socketId: input.socketId,
      authId: input.authId,
    },
    clientToken,
  });

  const roomSubscription = await addRoomSubscription({
    args: input,
    groupId: clientToken.groupId,
    clientTokenId: clientToken.id,
    existingRoom: room,
  });

  const response: IAddRoomSubscriptionEndpointResponse = {
    roomSubscription,
  };

  return response;
};
