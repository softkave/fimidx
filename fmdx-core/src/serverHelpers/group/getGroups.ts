import type { GetGroupsEndpointArgs } from "../../definitions/group.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToGroup } from "./objToGroup.js";

export function getGroupsObjQuery(params: { args: GetGroupsEndpointArgs }) {
  const { args } = params;
  const { query } = args;
  const { name, createdAt, updatedAt, createdBy, updatedBy, meta, appId, id } =
    query;

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

  const filterArr: Array<IObjPartQueryItem> = [
    ...(namePartQuery ?? []),
    ...(metaPartQuery ?? []),
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

export async function getGroups(params: { args: GetGroupsEndpointArgs }) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getGroupsObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.group,
    limit: limitNumber,
    page: pageNumber,
    sort: sort ? sort : undefined,
  });

  const groups = objs.map(objToGroup);

  return { groups, hasMore, page, limit };
}
