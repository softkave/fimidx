import {
  getCallbacksSchema,
  IGetCallbacksEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getApp, getCallbacks } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getCallbacksEndpoint: NextUserAuthenticatedEndpointFn<
  IGetCallbacksEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getCallbacksSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    groupId: app.groupId,
    permission: kPermissions.callback.read,
  });

  const { callbacks, hasMore, page, limit } = await getCallbacks({
    args: input,
  });

  const response: IGetCallbacksEndpointResponse = {
    callbacks,
    hasMore,
    page,
    limit,
  };

  return response;
};
