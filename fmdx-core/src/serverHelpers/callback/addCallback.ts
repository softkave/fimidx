import assert from "assert";
import { v7 as uuidv7 } from "uuid";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type {
  AddCallbackEndpointArgs,
  ICallbackObjRecord,
} from "../../definitions/callback.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { setManyObjs } from "../obj/setObjs.js";

export async function addCallback(params: {
  args: AddCallbackEndpointArgs;
  appId: string;
  groupId: string;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, appId, groupId, by, byType, storage } = params;
  const {
    url,
    method,
    requestHeaders,
    requestBody,
    timeout,
    intervalFrom,
    intervalMs,
    idempotencyKey: inputIdempotencyKey,
    name: inputName,
    description,
  } = args;

  const idempotencyKey =
    inputIdempotencyKey || `__fmdx_generated_${uuidv7()}_${Date.now()}`;
  const name = inputName || `__fmdx_generated_${uuidv7()}_${Date.now()}`;
  const objRecord: ICallbackObjRecord = {
    idempotencyKey,
    timeout: timeout ? new Date(timeout) : null,
    intervalFrom: intervalFrom ? new Date(intervalFrom) : null,
    intervalMs: intervalMs || null,
    lastErrorAt: null,
    lastExecutedAt: null,
    lastSuccessAt: null,
    method,
    requestBody: requestBody || null,
    requestHeaders: requestHeaders || null,
    url,
    name,
    description,
  };

  const { failedItems, newObjs } = await setManyObjs({
    by,
    byType,
    groupId,
    tag: kObjTags.callback,
    input: {
      appId,
      items: [objRecord],
      conflictOnKeys: ["idempotencyKey"],
      onConflict: "ignore",
    },
    storage,
  });

  assert(
    failedItems.length === 0,
    new OwnServerError(
      "Failed to add callback",
      kOwnServerErrorCodes.InternalServerError
    )
  );
  assert(
    newObjs.length === 1,
    new OwnServerError(
      "Failed to add callback",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const callback = newObjs[0];
  return callback;
}
