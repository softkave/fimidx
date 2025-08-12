import type { DeleteMonitorsEndpointArgs } from "../../definitions/monitor.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getMonitorsObjQuery } from "./getMonitors.js";

export async function deleteMonitors(
  params: DeleteMonitorsEndpointArgs & {
    by: string;
    byType: string;
    storage?: IObjStorage;
  }
) {
  const { deleteMany, by, byType, storage, ...args } = params;
  const objQuery = getMonitorsObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.monitor,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
    storage,
  });
}
