import { deleteClientTokensSchema } from "fmdx-core/definitions/clientToken";
import { deleteClientTokens } from "fmdx-core/serverHelpers/index";
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
