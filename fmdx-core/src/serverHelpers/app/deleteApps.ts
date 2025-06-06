import { type DeleteAppsEndpointArgs } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getAppsObjQuery } from "./getApps.js";

export async function deleteApps(
  params: DeleteAppsEndpointArgs & {
    by: string;
    byType: string;
  }
) {
  const { deleteMany, by, byType, ...args } = params;
  const objQuery = getAppsObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.app,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
  });
}
