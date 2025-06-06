import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  getAuthItemsSchema,
  IGetAuthItemsEndpointResponse,
} from "fmdx-core/definitions/webSockets";
import {
  checkPermission,
  getApp,
  getAuthItemList,
  tryGetAuthId,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getAuthItemsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetAuthItemsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken, userId },
  } = params;
  const input = getAuthItemsSchema.parse(await req.json());

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

  const authItems = await getAuthItemList(input);

  const response: IGetAuthItemsEndpointResponse = {
    authItems: authItems.authItems,
    total: authItems.total,
  };

  return response;
};
