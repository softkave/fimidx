import {
  EncodeClientTokenJWTEndpointResponse,
  encodeClientTokenJWTSchema,
} from "fmdx-core/definitions/clientToken";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  encodeClientTokenJWT,
  getClientToken,
} from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const encodeClientTokenEndpoint: NextUserAuthenticatedEndpointFn<
  EncodeClientTokenJWTEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    clientTokenId: string;
  };
  const input = encodeClientTokenJWTSchema.parse({
    ...(await req.json()),
    id: pathParams.clientTokenId,
  });

  const clientToken = await getClientToken({ id: input.id });
  await checkPermission({
    userId,
    groupId: clientToken.groupId,
    permission: kPermissions.clientToken.read,
  });

  const { refreshToken, token } = await encodeClientTokenJWT({
    id: clientToken.id,
    groupId: clientToken.groupId,
    appId: clientToken.appId,
    args: input,
  });

  const response: EncodeClientTokenJWTEndpointResponse = {
    refreshToken,
    token,
  };

  return response;
};
