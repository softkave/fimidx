import {
  RefreshClientTokenJWTEndpointResponse,
  refreshClientTokenJWTSchema,
} from "fmdx-core/definitions/clientToken";
import { refreshClientTokenJWT } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

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
