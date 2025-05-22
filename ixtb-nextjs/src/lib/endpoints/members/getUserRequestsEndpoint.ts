import {
  getUserRequestsSchema,
  IGetUserMemberRequestsEndpointResponse,
} from "fmdx-core/definitions/members";
import { getUserRequests } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getUserRequestsEndpoint: NextUserAuthenticatedEndpointFn<
  IGetUserMemberRequestsEndpointResponse
> = async (params) => {
  const { req, session } = params;
  const input = getUserRequestsSchema.parse(await req.json());
  const requests = await getUserRequests({
    userId: session.userId,
    limit: input.limit,
    page: input.page,
  });

  const response: IGetUserMemberRequestsEndpointResponse = {
    requests: requests.requests,
    total: requests.total,
  };

  return response;
};
