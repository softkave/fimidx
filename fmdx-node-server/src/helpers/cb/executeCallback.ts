import axios, {AxiosError} from 'axios';
import {getObjModel} from 'fmdx-core/db/fmdx.mongo';
import {
  callbackMethodSchema,
  kCallbackFmdxHeaders,
} from 'fmdx-core/definitions/index';
import {kObjTags} from 'fmdx-core/definitions/obj';
import {
  addCallbackExecution,
  objToCallback,
} from 'fmdx-core/serverHelpers/index';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {removeCallbackFromStore} from './removeCallbackFromStore.js';

export async function executeCallback(params: {callbackId: string}) {
  const {callbackId} = params;
  const obj = await getObjModel()
    .findOne({
      id: callbackId,
      tag: kObjTags.callback,
    })
    .lean();

  if (!obj) {
    removeCallbackFromStore(callbackId);
    return;
  }

  const callback = objToCallback(obj);
  console.log('Executing callback', callback.id);

  try {
    const response = await axios({
      method: callback.method,
      url: callback.url,
      data:
        callback.method === callbackMethodSchema.Values.GET
          ? undefined
          : callback.requestBody,
      headers: {
        ...(callback.requestHeaders ?? {}),
        [kCallbackFmdxHeaders.callbackId]: callback.id,
        [kCallbackFmdxHeaders.lastExecutedAt]: callback.lastExecutedAt
          ? new Date(callback.lastExecutedAt).toISOString()
          : undefined,
        [kCallbackFmdxHeaders.lastSuccessAt]: callback.lastSuccessAt
          ? new Date(callback.lastSuccessAt).toISOString()
          : undefined,
        [kCallbackFmdxHeaders.lastErrorAt]: callback.lastErrorAt
          ? new Date(callback.lastErrorAt).toISOString()
          : undefined,
      },
    });

    // separate execution to ensure the only error thrown is the one from axios
    kPromiseStore.callAndForget(async () => {
      await addCallbackExecution({
        appId: callback.appId,
        groupId: callback.groupId,
        callbackId,
        error: null,
        responseHeaders: Object.fromEntries(
          Object.entries(response.headers).map(([key, value]) => [
            key,
            value as string,
          ]),
        ),
        responseBody: response.data,
        responseStatusCode: response.status,
        executedAt: new Date(),
        clientTokenId: callback.createdBy,
      });
    });
  } catch (error) {
    kPromiseStore.callAndForget(async () => {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        await addCallbackExecution({
          appId: callback.appId,
          groupId: callback.groupId,
          callbackId,
          error: axiosError.message,
          responseHeaders: Object.fromEntries(
            Object.entries(axiosError.response.headers).map(([key, value]) => [
              key,
              value as string,
            ]),
          ),
          responseBody: axiosError.response.data
            ? String(axiosError.response.data)
            : null,
          executedAt: new Date(),
          clientTokenId: callback.createdBy,
          responseStatusCode: axiosError.response.status,
        });
      } else {
        await addCallbackExecution({
          appId: callback.appId,
          groupId: callback.groupId,
          callbackId,
          error: error instanceof Error ? error.message : String(error),
          responseHeaders: null,
          responseBody: null,
          responseStatusCode: null,
          executedAt: new Date(),
          clientTokenId: callback.createdBy,
        });
      }
    });
  }
}
