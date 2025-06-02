import type { GetLogsEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { getManyObjs } from "../obj/getObj.js";

export async function getLogs(params: GetLogsEndpointArgs) {
  const {
    appId,
    logIds,
    filter,
    page: inputPage,
    limit: inputLimit,
    sort,
  } = params;

  const {
    objs: logs,
    hasMore,
    page,
    limit,
  } = await getManyObjs({
    objQuery: {
      appId,
      partQuery: filter,
      metaQuery: logIds ? { id: { in: logIds } } : undefined,
    },
    tag: kObjTags.log,
    includeCount: true,
    limit: inputLimit,
    page: inputPage,
    sort,
  });

  return {
    logs,
    page,
    limit,
    hasMore,
  };
}
