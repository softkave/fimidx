import {
  EncodeClientTokenJWTEndpointResponse,
  encodeClientTokenJWTSchema,
} from "fmdx-core/definitions/clientToken";
import { encodeClientTokenJWT } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const encodeClientTokenEndpoint: NextClientTokenAuthenticatedEndpointFn<
  EncodeClientTokenJWTEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = encodeClientTokenJWTSchema.parse(await req.json());
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
