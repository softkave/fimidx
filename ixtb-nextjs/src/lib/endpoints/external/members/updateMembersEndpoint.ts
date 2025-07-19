import {
  IUpdateMembersEndpointResponse,
  updateMembersSchema,
} from "fmdx-core/definitions/member";
import { kByTypes } from "fmdx-core/definitions/other";
import { updateMembers } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const updateMembersEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IUpdateMembersEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = updateMembersSchema.parse(await req.json());
  await updateMembers({
    args: input,
    by: clientToken.id,
    byType: kByTypes.clientToken,
  });

  const response: IUpdateMembersEndpointResponse = {
    success: true,
  };

  return response;
};
