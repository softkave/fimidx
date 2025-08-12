import { deleteClientTokensSchema } from "fimidx-core/definitions/clientToken";
import { deleteClientTokens } from "fimidx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const deleteClientTokensEndpoint: NextMaybeAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { getBy },
  } = params;

  const input = deleteClientTokensSchema.parse(await req.json());
  await deleteClientTokens({
    query: input.query,
    by: getBy().by,
    byType: getBy().byType,
  });
};
