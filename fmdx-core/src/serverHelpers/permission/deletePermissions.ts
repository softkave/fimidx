import { kObjTags } from "../../definitions/obj.js";
import type { DeletePermissionsEndpointArgs } from "../../definitions/permission.js";
import type { IObjStorage } from "../../storage/types.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getPermissionsObjQuery } from "./getPermissions.js";

export async function deletePermissions(
  params: DeletePermissionsEndpointArgs & {
    by: string;
    byType: string;
    storage?: IObjStorage;
  }
) {
  const { deleteMany, by, byType, storage, ...args } = params;
  const objQuery = getPermissionsObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.permission,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
    storage,
  });
}
