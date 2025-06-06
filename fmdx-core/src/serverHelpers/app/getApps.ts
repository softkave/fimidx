import type { GetAppsEndpointArgs } from "../../definitions/app.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { kId0 } from "../../definitions/system.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToApp } from "./objToApp.js";

export function getAppsObjQuery(params: { args: GetAppsEndpointArgs }) {
  const { args } = params;
  const { query } = args;
  const { groupId, id, name, createdAt, updatedAt, createdBy, updatedBy } =
    query;

  const namePartQuery = name
    ? metaQueryToPartQueryList({
        metaQuery: { name },
      })
    : undefined;
  const groupIdPartQuery = groupId
    ? metaQueryToPartQueryList({
        metaQuery: { groupId: { eq: groupId } },
      })
    : undefined;

  const filterArr: Array<IObjPartQueryItem> = [
    ...(namePartQuery ?? []),
    ...(groupIdPartQuery ?? []),
  ];

  const objQuery: IObjQuery = {
    appId: kId0,
    partQuery: {
      and: filterArr,
    },
    metaQuery: {
      id,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    },
  };

  return objQuery;
}

export async function getApps(params: { args: GetAppsEndpointArgs }) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getAppsObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.app,
    limit: limitNumber,
    page: pageNumber,
  });

  const apps = objs.map(objToApp);
  return { apps, hasMore, page, limit };
}
