import type { GetLogsEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { getManyObjs } from "../obj/getObjs.js";

export async function getLogs(params: GetLogsEndpointArgs) {
  const {
    query: { appId, logsQuery, metaQuery },
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
      partQuery: logsQuery,
      metaQuery,
    },
    tag: kObjTags.log,
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
