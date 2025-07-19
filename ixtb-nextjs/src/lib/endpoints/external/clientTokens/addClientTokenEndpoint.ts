import {
  AddClientTokenEndpointResponse,
  addClientTokenSchema,
} from "fmdx-core/definitions/clientToken";
import { kByTypes } from "fmdx-core/definitions/other";
import { addClientToken } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const addClientTokenEndpoint: NextClientTokenAuthenticatedEndpointFn<
  AddClientTokenEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = addClientTokenSchema.parse(await req.json());
  const { clientToken: newClientToken } = await addClientToken({
    args: input,
    by: clientToken.id,
    byType: kByTypes.clientToken,
    groupId: clientToken.groupId,
  });

  const response: AddClientTokenEndpointResponse = {
    clientToken: newClientToken,
  };

  return response;
};
