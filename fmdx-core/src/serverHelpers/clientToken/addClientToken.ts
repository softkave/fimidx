import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type {
  AddClientTokenEndpointArgs,
  IClientTokenObjRecord,
} from "../../definitions/clientToken.js";
import { kObjTags } from "../../definitions/obj.js";
import { setManyObjs } from "../obj/setObjs.js";
import { objToClientToken } from "./objToClientToken.js";

export async function addClientToken(params: {
  args: AddClientTokenEndpointArgs;
  by: string;
  byType: string;
  groupId: string;
}) {
  const { args, by, byType, groupId } = params;
  const { name: inputName, description, appId, meta, permissions } = args;
  const date = new Date();
  const name =
    inputName ??
    `token-${date.getTime()}-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
  const objRecord: IClientTokenObjRecord = {
    name,
    description,
    meta,
    permissions: permissions ?? null,
  };

  const { failedItems, newObjs } = await setManyObjs({
    by,
    byType,
    groupId,
    tag: kObjTags.clientToken,
    input: {
      appId,
      items: [objRecord],
    },
  });

  assert(
    failedItems.length === 0,
    new OwnServerError(
      "Failed to add client token",
      kOwnServerErrorCodes.InternalServerError
    )
  );
  assert(
    newObjs.length === 1,
    new OwnServerError(
      "Failed to add client token",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const clientToken = objToClientToken(newObjs[0]);
  return { clientToken };
}
