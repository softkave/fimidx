import {
  RefreshClientTokenJWTEndpointResponse,
  refreshClientTokenJWTSchema,
} from "fimidx-core/definitions/clientToken";
import { refreshClientTokenJWT } from "fimidx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const refreshClientTokenEndpoint: NextClientTokenAuthenticatedEndpointFn<
  RefreshClientTokenJWTEndpointResponse
> = async (params) => {
  const {
    req,
    session: { jwtContent, clientToken },
  } = params;

  const input = refreshClientTokenJWTSchema.parse(await req.json());
  const { refreshToken, token } = await refreshClientTokenJWT({
    id: clientToken.id,
    refreshToken: input.refreshToken,
    jwtContent,
  });

  const response: RefreshClientTokenJWTEndpointResponse = {
    refreshToken,
    token,
  };

  return response;
};
