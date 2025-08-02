import {
  AddClientTokenEndpointResponse,
  addClientTokenSchema,
} from "fimidx-core/definitions/clientToken";
import { addClientToken } from "fimidx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const addClientTokenEndpoint: NextMaybeAuthenticatedEndpointFn<
  AddClientTokenEndpointResponse
> = async (params) => {
  const {
    req,
    session: { getBy },
  } = params;

  const input = addClientTokenSchema.parse(await req.json());
  const { clientToken: newClientToken } = await addClientToken({
    args: input,
    by: getBy().by,
    byType: getBy().byType,
  });

  const response: AddClientTokenEndpointResponse = {
    clientToken: newClientToken,
  };

  return response;
};
