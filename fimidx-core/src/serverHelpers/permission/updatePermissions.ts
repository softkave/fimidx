import { kObjTags } from "../../definitions/obj.js";
import type { UpdatePermissionsEndpointArgs } from "../../definitions/permission.js";
import type { IObjStorage } from "../../storage/types.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getPermissionsObjQuery } from "./getPermissions.js";

export async function updatePermissions(params: {
  args: UpdatePermissionsEndpointArgs;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, by, byType, storage } = params;
  const { update, updateMany } = args;

  const objQuery = getPermissionsObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.permission,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "merge",
    storage,
  });
}
