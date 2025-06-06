import type { GetMembersEndpointArgs } from "../../definitions/member.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToMember } from "./objToMember.js";

export function getMembersObjQuery(params: { args: GetMembersEndpointArgs }) {
  const { args } = params;
  const { query } = args;
  const {
    name,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    meta,
    appId,
    id,
    groupId,
    email,
    memberId,
    status,
  } = query;

  const namePartQuery = name
    ? metaQueryToPartQueryList({
        metaQuery: { name },
      })
    : undefined;
  const metaPartQuery = meta?.map(
    (part) =>
      ({
        op: part.op,
        field: `meta.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );
  const groupIdPartQuery = groupId
    ? metaQueryToPartQueryList({
        metaQuery: { id: { eq: groupId } },
      })
    : undefined;
  const emailPartQuery = email
    ? metaQueryToPartQueryList({
        metaQuery: { email },
      })
    : undefined;
  const memberIdPartQuery = memberId
    ? metaQueryToPartQueryList({
        metaQuery: { memberId },
      })
    : undefined;
  const statusPartQuery = status
    ? metaQueryToPartQueryList({
        metaQuery: { status },
      })
    : undefined;

  const filterArr: Array<IObjPartQueryItem> = [
    ...(namePartQuery ?? []),
    ...(metaPartQuery ?? []),
    ...(groupIdPartQuery ?? []),
    ...(emailPartQuery ?? []),
    ...(memberIdPartQuery ?? []),
    ...(statusPartQuery ?? []),
  ];

  const objQuery: IObjQuery = {
    appId,
    partQuery: {
      and: filterArr,
    },
    metaQuery: { id, createdAt, updatedAt, createdBy, updatedBy },
  };

  return objQuery;
}

export async function getMembers(params: { args: GetMembersEndpointArgs }) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getMembersObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.member,
    limit: limitNumber,
    page: pageNumber,
    sort: sort ? sort : undefined,
  });

  const members = objs.map(objToMember);

  return { members, hasMore, page, limit };
}
