import type { DeleteCallbacksEndpointArgs } from "../../definitions/callback.js";
import { kByTypes } from "../../definitions/index.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { deleteManyObjs } from "../obj/deleteObjs.js";
import { getCallbacksObjQuery } from "./getCallbacks.js";

export async function deleteCallbacks(
  params: DeleteCallbacksEndpointArgs & {
    clientTokenId: string;
    storage?: IObjStorage;
  }
) {
  const { deleteMany, clientTokenId, storage, ...args } = params;
  const objQuery = getCallbacksObjQuery({ args });
  await deleteManyObjs({
    objQuery,
    tag: kObjTags.callback,
    deletedBy: clientTokenId,
    deletedByType: kByTypes.clientToken,
    deleteMany,
    storage,
  });
}
