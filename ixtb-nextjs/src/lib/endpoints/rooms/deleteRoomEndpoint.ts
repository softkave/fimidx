import { deleteRoomSchema } from "fmdx-core/definitions/index";
import {
  checkClientTokenRoomAccess,
  deleteRoom,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const deleteRoomEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteRoomSchema.parse(await req.json());

  await checkClientTokenRoomAccess({
    input: {
      roomId: input.id,
      roomName: input.name,
      appId: input.appId,
    },
    clientToken,
  });

  await deleteRoom(input);
};
