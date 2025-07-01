import assert from "assert";
import { isArray, uniq } from "lodash-es";
import { indexArray } from "softkave-js-utils";
import type {
  GetMemberRequestsEndpointArgs,
  IMemberObjRecordMeta,
} from "../../definitions/member.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import type { IPermission } from "../../definitions/permission.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { getMembersPermissions } from "./getMembers.js";
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

  const memberIds = uniq(objs.map((obj) => obj.objRecord.memberId));
  const { permissions: memberPermissions } = await getMembersPermissions({
    appId: args.query.appId,
    memberIds,
    groupId: args.query.groupId,
  });

  const memberPermissionsMap = indexArray<IPermission, IPermission[]>(
    memberPermissions,
    {
      indexer: (permission) => {
        assert(permission.meta, "Permission meta is required");
        const meta = permission.meta as IMemberObjRecordMeta;
        return meta.__fmdx_managed_memberId;
      },
      reducer: (permission, _index, _arr, acc) => {
        const arr: IPermission[] = isArray(acc) ? acc : [];
        arr.push(permission);
        return arr;
      },
    }
  );

  const members = objs.map((obj) => {
    const memberId = obj.objRecord.memberId;
    const memberPermissions = memberPermissionsMap[memberId] ?? null;
    return objToMember(obj, memberPermissions);
  });
  const requests = await objToMemberRequest({ requests: members });

  return { requests, hasMore, page, limit };
}
