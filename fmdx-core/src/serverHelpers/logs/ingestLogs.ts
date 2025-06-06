import type { IngestLogsEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { setManyObjs } from "../obj/setObjs.js";

export async function ingestLogs(
  params: IngestLogsEndpointArgs & {
    groupId: string;
    by: string;
    byType: string;
  }
) {
  const { appId, logs, by, byType, groupId } = params;

  const date = new Date();
  const dateMs = date.getTime();
  logs.forEach((log) => {
    log.timestamp = log.timestamp || dateMs;
  });

  await setManyObjs({
    by,
    byType,
    groupId,
    tag: kObjTags.log,
    input: {
      appId,
      items: logs,
    },
  });
}
