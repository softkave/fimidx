import {
  IRespondToMemberRequestEndpointResponse,
  respondToMemberRequestSchema,
} from "fimidx-core/definitions/member";
import { respondToMemberRequest } from "fimidx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const respondToRequestEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IRespondToMemberRequestEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = respondToMemberRequestSchema.parse(await req.json());
  await respondToMemberRequest({
    args: input,
  });

  const response: IRespondToMemberRequestEndpointResponse = {
    success: true,
  };

  return response;
};
