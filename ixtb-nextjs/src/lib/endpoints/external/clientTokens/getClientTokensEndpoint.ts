import {
  GetClientTokensEndpointResponse,
  getClientTokensSchema,
} from "fimidx-core/definitions/clientToken";
import { getClientTokens } from "fimidx-core/serverHelpers/index";
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
