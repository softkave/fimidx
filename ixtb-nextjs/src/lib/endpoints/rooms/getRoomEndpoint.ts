import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  getRoomSchema,
  IGetRoomEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getRoom } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getRoomEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetRoomEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId, clientToken },
  } = params;
  const input = getRoomSchema.parse(await req.json());

  const room = await getRoom(input);

  if (userId) {
    await checkPermission({
      userId,
      groupId: room.groupId,
      permission: kPermissions.ws.read,
    });
  } else if (clientToken) {
    assert(
      room.appId === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  } else {
    throw new OwnServerError("Unauthorized", 403);
  }

  const response: IGetRoomEndpointResponse = {
    room,
  };

  return response;
};
