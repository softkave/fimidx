import type { GetMemberRequestsEndpointArgs } from "../../definitions/member.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToMember } from "./objToMember.js";
import { objToMemberRequest } from "./objToMemberRequest.js";

export function getMemberRequestsObjQuery(params: {
  args: GetMemberRequestsEndpointArgs;
}) {
  const { args } = params;
  const { query } = args;
  const { appId, groupId, memberId } = query;

  const groupIdPartQuery = groupId
    ? metaQueryToPartQueryList({
        metaQuery: { id: { eq: groupId } },
      })
    : undefined;
  const memberIdPartQuery = memberId
    ? metaQueryToPartQueryList({
        metaQuery: { memberId: { eq: memberId } },
      })
    : undefined;

  const filterArr: Array<IObjPartQueryItem> = [
    ...(groupIdPartQuery ?? []),
    ...(memberIdPartQuery ?? []),
  ];

  const objQuery: IObjQuery = {
    appId,
    partQuery: {
      and: filterArr,
    },
  };

  return objQuery;
}

export async function getMemberRequests(params: {
  args: GetMemberRequestsEndpointArgs;
}) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getMemberRequestsObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.member,
    limit: limitNumber,
    page: pageNumber,
    sort: undefined,
  });

  const members = objs.map(objToMember);
  const requests = await objToMemberRequest({ requests: members });

  return { requests, hasMore, page, limit };
}
