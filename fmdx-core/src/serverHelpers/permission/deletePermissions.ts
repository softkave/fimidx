import { kByTypes } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import type { DeletePermissionsEndpointArgs } from "../../definitions/permission.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getPermissionsObjQuery } from "./getPermissions.js";

export async function deletePermissions(
  params: DeletePermissionsEndpointArgs & {
    clientTokenId: string;
  }
) {
  const { deleteMany, clientTokenId, ...args } = params;
  const objQuery = getPermissionsObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.permission,
    deletedBy: clientTokenId,
    deletedByType: kByTypes.clientToken,
    deleteMany,
  });
}
