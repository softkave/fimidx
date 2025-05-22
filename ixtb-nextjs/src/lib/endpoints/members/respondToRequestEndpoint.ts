import {
  IRespondToMemberRequestEndpointResponse,
  respondToMemberRequestSchema,
} from "fmdx-core/definitions/members";
import {
  augmentUserRequests,
  respondToMemberRequest,
} from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const respondToRequestEndpoint: NextUserAuthenticatedEndpointFn<
  IRespondToMemberRequestEndpointResponse
> = async (params) => {
  const { req, session } = params;
  const input = respondToMemberRequestSchema.parse(await req.json());

  const member = await respondToMemberRequest({
    args: {
      requestId: input.requestId,
      status: input.status,
    },
    userId: session.userId,
  });

  const augmentedMember = await augmentUserRequests({
    requests: [member],
  });

  const response: IRespondToMemberRequestEndpointResponse = {
    member: augmentedMember[0],
  };

  return response;
};
