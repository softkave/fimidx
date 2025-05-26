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
    req,
    session: { userId },
  } = params;
  const input = getCallbackSchema.parse(await req.json());

  const callback = await getCallback(input);
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
