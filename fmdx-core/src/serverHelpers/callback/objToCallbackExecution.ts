import type { IObj } from "fmdx-core/definitions/obj";
import type { ICallbackExecution } from "../../definitions/callback.js";

export function objToCallbackExecution(obj: IObj): ICallbackExecution {
  return {
    id: obj.id,
    groupId: obj.groupId,
    appId: obj.appId,
    callbackId: obj.objRecord.callbackId,
    error: obj.objRecord.error,
    responseHeaders: obj.objRecord.responseHeaders,
    responseBody: obj.objRecord.responseBody,
    responseStatusCode: obj.objRecord.responseStatusCode,
    executedAt: obj.objRecord.executedAt,
  };
}
