import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type {
  AddMonitorEndpointArgs,
  IMonitorObjRecord,
} from "../../definitions/monitor.js";
import { kObjTags } from "../../definitions/obj.js";
import { setManyObjs } from "../obj/setObjs.js";
import { objToMonitor } from "./objToMonitor.js";

export async function addMonitor(params: {
  args: AddMonitorEndpointArgs;
  by: string;
  byType: string;
  groupId: string;
}) {
  const { args, by, byType, groupId } = params;
  const { name, status, interval, reportsTo, appId, logsQuery, description } =
    args;
  const objRecord: IMonitorObjRecord = {
    name,
    status,
    interval,
    reportsTo: reportsTo.map((userId) => ({ userId })),
    logsQuery,
    description,
  };

  const { failedItems, newObjs } = await setManyObjs({
    by,
    byType,
    groupId,
    tag: kObjTags.monitor,
    input: {
      appId,
      items: [objRecord],
      conflictOnKeys: ["name"],
      onConflict: "fail",
    },
  });

  assert(
    failedItems.length === 0,
    new OwnServerError(
      "Failed to add monitor",
      kOwnServerErrorCodes.InternalServerError
    )
  );
  assert(
    newObjs.length === 1,
    new OwnServerError(
      "Failed to add monitor",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const monitor = objToMonitor(newObjs[0]);
  return { monitor };
}
