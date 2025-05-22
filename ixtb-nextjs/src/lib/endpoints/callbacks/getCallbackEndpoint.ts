import {
  getCallbackSchema,
  IGetCallbackEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getCallback } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getCallbackEndpoint: NextUserAuthenticatedEndpointFn<
  IGetCallbackEndpointResponse
> = async (params) => {
  const {
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    callbackId: string;
  };
  const input = getCallbackSchema.parse({
    id: pathParams.callbackId,
  });

  const callback = await getCallback({ id: input.id });
  await checkPermission({
    userId,
    orgId: callback.orgId,
    permission: kPermissions.callback.read,
  });

  const response: IGetCallbackEndpointResponse = {
    callback,
  };

  return response;
};
