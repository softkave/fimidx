import assert from "assert";
import { OwnServerError } from "../../common/error.js";
import type { IClientToken } from "../../definitions/clientToken.js";
import { getApp, getAuthId, getConnectedWebSocket, getRoom } from "../index.js";

export async function checkClientTokenRoomAccess(params: {
  input: {
    roomId?: string;
    socketId?: string;
    authId?: string;
    appId?: string;
    roomName?: string;
  };
  clientToken: IClientToken;
}) {
  const { input, clientToken } = params;
  const [room, socket, authId, app] = await Promise.all([
    input.roomId
      ? getRoom({
          id: input.roomId,
          appId: input.appId,
          name: input.roomName,
        })
      : null,
    input.socketId ? getConnectedWebSocket({ id: input.socketId }) : null,
    input.authId ? getAuthId({ id: input.authId }) : null,
    input.appId ? getApp({ id: input.appId }) : null,
  ]);

  let isAuthorized = false;

  if (room) {
    assert(
      room.appId === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
    isAuthorized = true;
  }

  if (app) {
    assert(
      app.id === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  }

  if (socket) {
    assert(
      socket.appId === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  }

  if (authId) {
    assert(
      authId.appId === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  }

  if (!isAuthorized) {
    throw new OwnServerError("Unauthorized", 403);
  }

  return {
    room,
    socket,
    authId,
  };
}
