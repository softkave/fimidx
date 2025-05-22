import { deleteRoomSubscriptionSchema } from "fmdx-core/definitions/index";
import {
  checkClientTokenRoomAccess,
  deleteRoomSubscription,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const deleteRoomSubscriptionEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteRoomSubscriptionSchema.parse(await req.json());

  await checkClientTokenRoomAccess({
    input: {
      roomId: input.roomId,
      appId: input.appId,
      roomName: input.roomName,
      socketId: input.socketId,
      authId: input.authId,
    },
    clientToken,
  });

  await deleteRoomSubscription(input);
};
