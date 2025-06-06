import type { GetMonitorsEndpointArgs } from "../../definitions/monitor.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToMonitor } from "./objToMonitor.js";

export function getMonitorsObjQuery(params: { args: GetMonitorsEndpointArgs }) {
  const { args } = params;
  const { query } = args;
  const {
    name,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    reportsTo,
    status,
    appId,
    id,
  } = query;

  const namePartQuery = name
    ? metaQueryToPartQueryList({
        metaQuery: { name },
      })
    : undefined;
  const statusPartQuery = status
    ? metaQueryToPartQueryList({
        metaQuery: { status },
      })
    : undefined;
  const reportsToPartQuery = reportsTo
    ? metaQueryToPartQueryList({
        metaQuery: { [`reportsTo.userId`]: reportsTo },
      })
    : undefined;

  const filterArr: Array<IObjPartQueryItem> = [
    ...(namePartQuery ?? []),
    ...(statusPartQuery ?? []),
    ...(reportsToPartQuery ?? []),
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

export async function getMonitors(params: { args: GetMonitorsEndpointArgs }) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getMonitorsObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.monitor,
    limit: limitNumber,
    page: pageNumber,
  });

  const monitors = objs.map(objToMonitor);
  return { monitors, hasMore, page, limit };
}
