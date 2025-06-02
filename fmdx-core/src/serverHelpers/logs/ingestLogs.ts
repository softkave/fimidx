import type { IngestLogsEndpointArgs } from "../../definitions/log.js";
import { kObjTags } from "../../definitions/obj.js";
import { setManyObjs } from "../obj/setObj.js";

export async function ingestLogs(
  params: IngestLogsEndpointArgs & { orgId: string; by: string; byType: string }
) {
  const { appId, logs, by, byType, orgId } = params;

  const date = new Date();
  const dateMs = date.getTime();
  logs.forEach((log) => {
    log.timestamp = log.timestamp || dateMs;
  });

  await setManyObjs({
    by,
    byType,
    orgId,
    tag: kObjTags.log,
    input: {
      appId,
      items: logs,
    },
  });
}
