import {
  getCallbacksSchema,
  IGetCallbacksEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getApp, getCallbackList } from "fmdx-core/serverHelpers/index";
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
    orgId: app.orgId,
    permission: kPermissions.callback.read,
  });

  const { callbacks, total } = await getCallbackList({
    args: input,
    orgId: app.orgId,
    appId: input.appId,
  });

  const response: IGetCallbacksEndpointResponse = {
    callbacks,
    total,
  };

  return response;
};
