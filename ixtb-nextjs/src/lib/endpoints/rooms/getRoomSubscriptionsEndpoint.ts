import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  getRoomSubscriptionsSchema,
  IGetRoomSubscriptionsEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import {
  checkPermission,
  getAuthId,
  getConnectedWebSocket,
  getRoom,
  getRoomSubscriptions,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getRoomSubscriptionsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetRoomSubscriptionsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId, clientToken },
  } = params;
  const input = getRoomSubscriptionsSchema.parse(await req.json());

  const [room, socket, authId] = await Promise.all([
    getRoom({
      id: input.roomId,
      name: input.roomName,
      appId: input.appId,
    }),
    input.socketId ? getConnectedWebSocket({ id: input.socketId }) : null,
    input.authId ? getAuthId({ id: input.authId }) : null,
  ]);

  if (userId) {
    await checkPermission({
      userId,
      orgId: room.orgId,
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

  if (input.appId) {
    assert(input.appId === room.appId, new OwnServerError("Unauthorized", 403));
  }

  if (socket) {
    assert(
      socket.appId === room.appId,
      new OwnServerError("Unauthorized", 403)
    );
  }

  if (authId) {
    assert(
      authId.appId === room.appId,
      new OwnServerError("Unauthorized", 403)
    );
  }

  const { roomSubscriptions, total } = await getRoomSubscriptions(input);

  const response: IGetRoomSubscriptionsEndpointResponse = {
    roomSubscriptions,
    total,
  };

  return response;
};
