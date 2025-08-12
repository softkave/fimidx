import type { UpdateGroupsEndpointArgs } from "../../definitions/group.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getGroupsObjQuery } from "./getGroups.js";

export async function updateGroups(params: {
  args: UpdateGroupsEndpointArgs;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, by, byType, storage } = params;
  const { update, updateMany } = args;

  const objQuery = getGroupsObjQuery({ args });

  // Use merge strategy for partial updates, but handle meta field specially
  // The meta field will be completely replaced when present in the update
  await updateManyObjs({
    objQuery,
    tag: kObjTags.group,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "merge",
    storage,
  });
}
