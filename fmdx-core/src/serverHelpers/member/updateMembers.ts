import type { UpdateMembersEndpointArgs } from "../../definitions/member.js";
import { kObjTags } from "../../definitions/obj.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getMembersObjQuery } from "./getMembers.js";

export async function updateMembers(params: {
  args: UpdateMembersEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { update, updateMany } = args;

  const objQuery = getMembersObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.member,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "replace",
  });
}
