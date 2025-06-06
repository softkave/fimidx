import type { UpdateClientTokensEndpointArgs } from "../../definitions/clientToken.js";
import { kObjTags } from "../../definitions/obj.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getClientTokensObjQuery } from "./getClientTokens.js";

export async function updateClientTokens(params: {
  args: UpdateClientTokensEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { update, updateMany } = args;

  const objQuery = getClientTokensObjQuery({ args });
  await updateManyObjs({
    objQuery,
    tag: kObjTags.clientToken,
    by,
    byType,
    update,
    count: updateMany ? undefined : 1,
    updateWay: "replace",
  });
}
