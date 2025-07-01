import type { ICallbackExecution } from "../../definitions/callback.js";
import type { IObj } from "../../definitions/obj.js";

export function objToCallbackExecution(obj: IObj): ICallbackExecution {
  return {
    id: obj.id,
    groupId: obj.groupId,
    appId: obj.appId,
    callbackId: obj.objRecord.callbackId,
    error: obj.objRecord.error,
    responseHeaders: obj.objRecord.responseHeaders,
    responseBodyRaw: obj.objRecord.responseBodyRaw,
    responseStatusCode: obj.objRecord.responseStatusCode,
    executedAt: obj.objRecord.executedAt,
    responseBodyJson: obj.objRecord.responseBodyJson,
  };
}
