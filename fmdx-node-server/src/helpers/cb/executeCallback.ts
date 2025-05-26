import axios, {AxiosError} from 'axios';
import {callbackMethodSchema} from 'fmdx-core/definitions/index';
import {
  getCallback,
  updateCallbackExecution,
} from 'fmdx-core/serverHelpers/index';
import {kPromiseStore} from '../../ctx/promiseStore.js';

export async function executeCallback(params: {callbackId: string}) {
  const {callbackId} = params;
  const callback = await getCallback({id: callbackId});

  try {
    const response = await axios({
      method: callback.method,
      url: callback.url,
      data:
        callback.method === callbackMethodSchema.Values.GET
          ? undefined
          : callback.requestBody,
      headers: {...callback.requestHeaders, 'x-fmdx-callback-id': callbackId},
    });

    // separate execution to ensure the only error thrown is the one from axios
    kPromiseStore.callAndForget(() => {
      return updateCallbackExecution({
        callbackId,
        executedAt: new Date(),
        error: null,
        responseHeaders: Object.fromEntries(
          Object.entries(response.headers).map(([key, value]) => [
            key,
            value as string,
          ]),
        ),
        responseBody: response.data,
        responseStatusCode: response.status,
      });
    });
  } catch (error) {
    kPromiseStore.callAndForget(() => {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        return updateCallbackExecution({
          callbackId,
          executedAt: new Date(),
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
          responseStatusCode: axiosError.response.status,
        });
      } else {
        return updateCallbackExecution({
          callbackId,
          executedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
}
