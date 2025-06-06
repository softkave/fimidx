import { type DeleteMembersEndpointArgs } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getMembersObjQuery } from "./getMembers.js";

export async function deleteMembers(
  params: DeleteMembersEndpointArgs & {
    by: string;
    byType: string;
  }
) {
  const { deleteMany, by, byType, ...args } = params;
  const objQuery = getMembersObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.member,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
  });
}
