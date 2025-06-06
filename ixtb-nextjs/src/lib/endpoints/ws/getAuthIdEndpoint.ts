import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  getAuthIdSchema,
  IGetAuthIdEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { checkPermission, getAuthId } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getAuthIdEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetAuthIdEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken, userId },
  } = params;
  const input = getAuthIdSchema.parse(await req.json());

  const authId = await getAuthId({
    id: input.authId,
    appId: input.appId,
    authId: input.authId,
  });

  if (userId) {
    await checkPermission({
      userId,
      groupId: authId.groupId,
      permission: kPermissions.ws.read,
    });
  } else if (clientToken) {
    assert(
      authId.appId === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  } else {
    throw new OwnServerError("Unauthorized", 403);
  }

  const response: IGetAuthIdEndpointResponse = {
    authId,
  };

  return response;
};
