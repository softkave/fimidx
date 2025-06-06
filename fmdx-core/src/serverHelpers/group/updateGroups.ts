import type { UpdateGroupsEndpointArgs } from "../../definitions/group.js";
import { kObjTags } from "../../definitions/obj.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getGroupsObjQuery } from "./getGroups.js";

export async function updateGroups(params: {
  args: UpdateGroupsEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { update, updateMany } = args;

  const objQuery = getGroupsObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.group,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "replace",
  });
}
