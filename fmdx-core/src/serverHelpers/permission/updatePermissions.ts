import { kObjTags } from "../../definitions/obj.js";
import type { UpdatePermissionsEndpointArgs } from "../../definitions/permission.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getPermissionsObjQuery } from "./getPermissions.js";

export async function updatePermissions(params: {
  args: UpdatePermissionsEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { update, updateMany } = args;

  const objQuery = getPermissionsObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.permission,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "replace",
  });
}
