import type { ICallbackExecutionObjRecord } from "../../definitions/callback.js";
import { kObjTags } from "../../definitions/obj.js";
import { kByTypes } from "../../definitions/other.js";
import { setManyObjs } from "../obj/setObjs.js";

export async function addCallbackExecution(params: {
  appId: string;
  groupId: string;
  callbackId: string;
  error: string | null;
  responseHeaders: Record<string, string> | null;
  responseBody: string | null;
  responseStatusCode: number | null;
  executedAt: number | Date;
  clientTokenId: string;
}) {
  const {
    appId,
    groupId,
    callbackId,
    error,
    responseHeaders,
    responseBody,
    responseStatusCode,
    executedAt,
    clientTokenId,
  } = params;

  const objRecord: ICallbackExecutionObjRecord = {
    callbackId,
    error,
    responseHeaders,
    responseBody,
    responseStatusCode,
    executedAt,
  };

  await setManyObjs({
    by: clientTokenId,
    byType: kByTypes.clientToken,
    groupId,
    tag: kObjTags.callbackExecution,
    input: {
      appId,
      items: [objRecord],
    },
  });
}
