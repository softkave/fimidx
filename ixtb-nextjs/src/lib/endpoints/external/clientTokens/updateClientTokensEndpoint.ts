import {
  UpdateClientTokensEndpointResponse,
  updateClientTokensSchema,
} from "fmdx-core/definitions/clientToken";
import { kByTypes } from "fmdx-core/definitions/other";
import { updateClientTokens } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const updateClientTokensEndpoint: NextClientTokenAuthenticatedEndpointFn<
  UpdateClientTokensEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = updateClientTokensSchema.parse(await req.json());
  await updateClientTokens({
    args: input,
    by: clientToken.id,
    byType: kByTypes.clientToken,
  });

  const response: UpdateClientTokensEndpointResponse = {
    success: true,
  };

  return response;
};
