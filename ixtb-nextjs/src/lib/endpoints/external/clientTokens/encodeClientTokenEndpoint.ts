import { getClientToken } from "@/src/lib/serverHelpers/clientToken/getClientToken";
import {
  EncodeClientTokenJWTEndpointResponse,
  encodeClientTokenJWTSchema,
} from "fmdx-core/definitions/clientToken";
import { encodeClientTokenJWT } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const encodeClientTokenEndpoint: NextMaybeAuthenticatedEndpointFn<
  EncodeClientTokenJWTEndpointResponse
> = async (params) => {
  const {
    req,
    session: { getBy },
  } = params;

  const input = encodeClientTokenJWTSchema.parse(await req.json());
  const { clientToken } = await getClientToken({
    input: { clientTokenId: input.id },
  });
  const { refreshToken, token } = await encodeClientTokenJWT({
    id: input.id,
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
