import assert from "assert";
import { v7 as uuidv7 } from "uuid";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type {
  AddCallbackEndpointArgs,
  ICallbackObjRecord,
} from "../../definitions/callback.js";
import { kObjTags } from "../../definitions/obj.js";
import { setManyObjs } from "../obj/setObjs.js";
import { getCallbacks } from "./getCallbacks.js";

export async function addCallback(params: {
  args: AddCallbackEndpointArgs;
  appId: string;
  groupId: string;
  by: string;
  byType: string;
}) {
  const { args, appId, groupId, by, byType } = params;
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

  const { failedItems } = await setManyObjs({
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
  });

  assert(
    failedItems.length === 0,
    new OwnServerError(
      "Failed to add callback",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const {
    callbacks: [callback],
  } = await getCallbacks({
    args: {
      query: {
        appId,
        idempotencyKey: { eq: idempotencyKey },
      },
    },
  });

  assert(
    callback,
    new OwnServerError(
      "Failed to add callback",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  return callback;
}
