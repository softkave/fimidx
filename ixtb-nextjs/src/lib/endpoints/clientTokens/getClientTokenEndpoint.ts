import {
  GetClientTokenEndpointResponse,
  getClientTokenSchema,
} from "fmdx-core/definitions/clientToken";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getClientToken } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getClientTokenEndpoint: NextUserAuthenticatedEndpointFn<
  GetClientTokenEndpointResponse
> = async (params) => {
  const {
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    clientTokenId: string;
  };
  const input = getClientTokenSchema.parse({
    id: pathParams.clientTokenId,
  });

  const clientToken = await getClientToken({
    id: input.id,
  });
  await checkPermission({
    userId,
    groupId: clientToken.groupId,
    permission: kPermissions.clientToken.read,
  });

  const response: GetClientTokenEndpointResponse = {
    clientToken,
  };

  return response;
};
