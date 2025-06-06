import { type DeleteClientTokensEndpointArgs } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getClientTokensObjQuery } from "./getClientTokens.js";

export async function deleteClientTokens(
  params: DeleteClientTokensEndpointArgs & {
    by: string;
    byType: string;
  }
) {
  const { deleteMany, by, byType, ...args } = params;
  const objQuery = getClientTokensObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.clientToken,
    deletedBy: by,
    deletedByType: byType,
    deleteMany,
  });
}
