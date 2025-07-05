import { type DeleteAppsEndpointArgs } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getAppsObjQuery } from "./getApps.js";

export async function deleteApps(
  params: DeleteAppsEndpointArgs & {
    by: string;
    byType: string;
    storage?: IObjStorage;
  }
) {
  const { deleteMany, by, byType, storage, ...args } = params;
  const objQuery = getAppsObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.app,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
    storage,
  });
}
