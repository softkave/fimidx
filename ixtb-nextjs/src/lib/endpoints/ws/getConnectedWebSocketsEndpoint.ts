import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  getConnectedWebSocketsSchema,
  IGetConnectedWebSocketsEndpointResponse,
} from "fmdx-core/definitions/webSockets";
import {
  checkPermission,
  getApp,
  getConnectedWebSocketList,
  tryGetAuthId,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getConnectedWebSocketsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetConnectedWebSocketsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken, userId },
  } = params;
  const input = getConnectedWebSocketsSchema.parse(await req.json());

  const [authId, app] = await Promise.all([
    tryGetAuthId({
      id: input.authId,
      appId: input.appId,
      authId: input.authId,
    }),
    getApp({ id: input.appId }),
  ]);

  if (userId) {
    await checkPermission({
      userId,
      groupId: app.groupId,
      permission: kPermissions.ws.read,
    });
  } else if (clientToken) {
    assert(
      app.id === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  } else {
    throw new OwnServerError("Unauthorized", 403);
  }

  if (authId) {
    assert(app.id === authId.appId, new OwnServerError("Unauthorized", 403));
  }

  const connectedWebSockets = await getConnectedWebSocketList(input);

  const response: IGetConnectedWebSocketsEndpointResponse = {
    connectedWebSockets: connectedWebSockets.connectedWebSockets,
    total: connectedWebSockets.total,
  };

  return response;
};
