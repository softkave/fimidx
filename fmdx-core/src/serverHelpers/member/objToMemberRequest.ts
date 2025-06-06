import { first, uniqBy } from "lodash-es";
import {
  type IMember,
  type IMemberRequest,
  type MemberStatus,
} from "../../definitions/member.js";
import { getGroups } from "../group/getGroups.js";

export async function objToMemberRequest(params: { requests: IMember[] }) {
  const { requests } = params;

  const groups = await Promise.all(
    uniqBy(requests, (request) => request.groupId).map(async (request) => {
      const { groups } = await getGroups({
        args: {
          query: {
            appId: request.appId,
            id: { eq: request.groupId },
          },
          limit: 1,
        },
      });

      return first(groups);
    })
  );

  const requestsWithGroup = requests
    .map((request, index): IMemberRequest => {
      const group = groups[index];
      return {
        requestId: request.id,
        groupName: group?.name ?? "",
        status: request.status as MemberStatus,
        updatedAt: request.updatedAt,
      };
    })
    .filter((request) => request.groupName !== "");

  return requestsWithGroup;
}
