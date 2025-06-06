import type { UpdateAppsEndpointArgs } from "../../definitions/app.js";
import { kObjTags } from "../../definitions/obj.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getAppsObjQuery } from "./getApps.js";

export async function updateApps(params: {
  args: UpdateAppsEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { update, updateMany } = args;

  const objQuery = getAppsObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.app,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "replace",
  });
}
