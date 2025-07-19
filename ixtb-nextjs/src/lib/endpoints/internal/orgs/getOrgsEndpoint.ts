import { GetOrgsEndpointResponse, getOrgsSchema } from "@/src/definitions/org";
import { kMemberStatus } from "fmdx-core/definitions/member";
import { kId0 } from "fmdx-core/definitions/system";
import { getGroups, getMemberRequests } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../../types";
import { groupToOrg } from "./groupToOrg";

export const getOrgsEndpoint: NextUserAuthenticatedEndpointFn<
  GetOrgsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;

  const input = getOrgsSchema.parse(await req.nextUrl.searchParams);
  const requests = await getMemberRequests({
    args: {
      query: {
        appId: kId0,
        memberId: userId,
        status: kMemberStatus.accepted,
      },
      page: input.page,
      limit: input.limit,
    },
  });

  const groupIds = requests.requests.map((request) => request.groupId);
  const { groups } = await getGroups({
    args: {
      query: { id: { in: groupIds }, appId: kId0 },
    },
  });

  const response: GetOrgsEndpointResponse = {
    orgs: groups.map(groupToOrg),
    page: requests.page,
    limit: requests.limit,
    hasMore: requests.hasMore,
  };

  return response;
};
