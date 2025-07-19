import { deleteClientTokensSchema } from "fmdx-core/definitions/clientToken";
import { kByTypes } from "fmdx-core/definitions/other";
import { deleteClientTokens } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const deleteClientTokensEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = deleteClientTokensSchema.parse(await req.json());
  await deleteClientTokens({
    query: input.query,
    by: clientToken.id,
    byType: kByTypes.clientToken,
  });
};
