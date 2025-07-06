import { uniqBy } from "lodash-es";
import {
  type IMember,
  type IMemberRequest,
  type MemberStatus,
} from "../../definitions/member.js";
import { getGroups } from "../group/getGroups.js";

export async function objToMemberRequest(params: { requests: IMember[] }) {
  const { requests } = params;

  // Get unique groupIds from all requests
  const uniqueGroupIds = uniqBy(requests, (request) => request.groupId).map(
    (request) => request.groupId
  );

  // Get all groups for the app (since we need to filter by groupId)
  const { groups } = await getGroups({
    args: {
      query: {
        appId: requests[0]?.appId || "",
      },
      limit: 1000, // Get all groups to filter by groupId
    },
  });

  // Create a map of groupId to group
  const groupMap = new Map();
  groups.forEach((group) => {
    groupMap.set(group.groupId, group);
  });

  const requestsWithGroup = requests
    .map((request): IMemberRequest => {
      const group = groupMap.get(request.groupId);
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
