import {
  UpdateClientTokensEndpointResponse,
  updateClientTokensSchema,
} from "fimidx-core/definitions/clientToken";
import { updateClientTokens } from "fimidx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const updateClientTokensEndpoint: NextMaybeAuthenticatedEndpointFn<
  UpdateClientTokensEndpointResponse
> = async (params) => {
  const {
    req,
    session: { getBy },
  } = params;

  const input = updateClientTokensSchema.parse(await req.json());
  await updateClientTokens({
    args: input,
    by: getBy().by,
    byType: getBy().byType,
  });

  const response: UpdateClientTokensEndpointResponse = {
    success: true,
  };

  return response;
};
