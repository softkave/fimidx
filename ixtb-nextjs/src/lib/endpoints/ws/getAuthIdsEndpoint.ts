import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  getAuthIdsSchema,
  IGetAuthIdsEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import {
  checkPermission,
  getApp,
  getAuthIdList,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getAuthIdsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetAuthIdsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken, userId },
  } = params;
  const input = getAuthIdsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
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

  const authIds = await getAuthIdList(input);

  const response: IGetAuthIdsEndpointResponse = {
    authIds: authIds.authIds,
    total: authIds.total,
  };

  return response;
};
