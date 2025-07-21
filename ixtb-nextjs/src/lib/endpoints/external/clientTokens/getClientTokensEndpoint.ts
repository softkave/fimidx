import {
  GetClientTokensEndpointResponse,
  getClientTokensSchema,
} from "fmdx-core/definitions/clientToken";
import { getClientTokens } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const getClientTokensEndpoint: NextMaybeAuthenticatedEndpointFn<
  GetClientTokensEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getClientTokensSchema.parse(await req.json());
  const { clientTokens, page, limit, hasMore } = await getClientTokens({
    args: input,
  });

  const response: GetClientTokensEndpointResponse = {
    clientTokens,
    page,
    limit,
    hasMore,
  };

  return response;
};
