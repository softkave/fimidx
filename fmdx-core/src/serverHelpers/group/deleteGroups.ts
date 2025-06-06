import { type DeleteGroupsEndpointArgs } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getGroupsObjQuery } from "./getGroups.js";

export async function deleteGroups(
  params: DeleteGroupsEndpointArgs & {
    by: string;
    byType: string;
  }
) {
  const { deleteMany, by, byType, ...args } = params;
  const objQuery = getGroupsObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.group,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
  });
}
