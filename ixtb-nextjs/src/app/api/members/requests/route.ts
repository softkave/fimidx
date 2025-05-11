import {
  getUserRequestsSchema,
  IGetUserMemberRequestsEndpointResponse,
} from "@/src/definitions/members";
import { getUserRequests } from "@/src/lib/serverHelpers/member/getUserRequests";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";

export const GET = wrapAuthenticated(async (req, ctx, session) => {
  const input = getUserRequestsSchema.parse(await req.nextUrl.searchParams);
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
});
