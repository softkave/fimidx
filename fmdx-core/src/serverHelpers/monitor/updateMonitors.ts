import type { UpdateMonitorsEndpointArgs } from "../../definitions/monitor.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getMonitorsObjQuery } from "./getMonitors.js";

export async function updateMonitors(params: {
  args: UpdateMonitorsEndpointArgs;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, by, byType, storage } = params;
  const { update, updateMany } = args;

  const objQuery = getMonitorsObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.monitor,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "replace",
    storage,
  });
}
