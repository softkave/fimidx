import {
  GetClientTokensEndpointResponse,
  getClientTokensSchema,
} from "fmdx-core/definitions/clientToken";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getApp, getClientTokenList } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getClientTokensEndpoint: NextUserAuthenticatedEndpointFn<
  GetClientTokensEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getClientTokensSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    groupId: app.groupId,
    permission: kPermissions.clientToken.read,
  });
  const { clientTokens, total } = await getClientTokenList({
    args: input,
    appId: app.id,
    groupId: app.groupId,
  });

  const response: GetClientTokensEndpointResponse = {
    clientTokens,
    total,
  };

  return response;
};
