import {
  addMemberSchema,
  IAddMemberEndpointResponse,
  kByTypes,
} from "fmdx-core/definitions/index";
import { addMember } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const addMemberEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddMemberEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = addMemberSchema.parse(await req.json());
  const { member } = await addMember({
    args: input,
    by: clientToken.id,
    byType: kByTypes.clientToken,
  });

  const response: IAddMemberEndpointResponse = {
    member,
  };

  return response;
};
