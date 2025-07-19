import {
  getMemberRequestsSchema,
  IGetMemberRequestsEndpointResponse,
} from "fmdx-core/definitions/member";
import { getMemberRequests } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const getMemberRequestsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IGetMemberRequestsEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getMemberRequestsSchema.parse(await req.json());
  const requests = await getMemberRequests({
    args: input,
  });

  const response: IGetMemberRequestsEndpointResponse = {
    requests: requests.requests,
    hasMore: requests.hasMore,
    page: requests.page,
    limit: requests.limit,
  };

  return response;
};
