import {Request, Response} from 'express';
import {kOwnServerErrorCodes, OwnServerError} from 'fmdx-core/common/error';
import {addCallbackSchema, ICallback} from 'fmdx-core/definitions/callback';
import {addCallbackBatch, getCallbackList} from 'fmdx-core/serverHelpers/index';
import {compact, uniq} from 'lodash-es';
import {getDeferredPromise} from 'softkave-js-utils';
import {z} from 'zod';
import {kAddCallbackQueue} from '../../ctx/callback.js';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {addCallbackToStore} from '../../helpers/cb/addCallbackToStore.js';
import {IHttpOutgoingErrorResponse} from '../../types/http.js';
import {IAddCallbackHttpOutgoingSuccessResponse} from './types.js';

let isProcessing = false;

async function processNextCallbacksBatch() {
  // do not add any async code -- from here
  if (isProcessing) {
    return;
  }

  isProcessing = true;
  // -- to here

  const batch = kAddCallbackQueue.splice(0, 100);

  if (batch.length === 0) {
    isProcessing = false;
    return;
  }

  const idempotencyKeys = uniq(
    compact(batch.map(item => item.item.idempotencyKey)),
  );
  const existingCallbacks =
    idempotencyKeys.length > 0
      ? await getCallbackList({
          args: {
            appId: batch[0].item.appId,
            idempotencyKey: idempotencyKeys,
            page: 1,
            limit: 100,
          },
          includeCount: false,
        })
      : {callbacks: []};

  const existingCallbacksMap = new Map(
    existingCallbacks.callbacks.map(item => [item.idempotencyKey, item]),
  );
  const newUniqueBatch = batch.filter(item =>
    item.item.idempotencyKey
      ? !existingCallbacksMap.has(item.item.idempotencyKey)
      : true,
  );

  const newCallbacks = await addCallbackBatch({
    args: newUniqueBatch.map(item => ({
      ...item.item,
      orgId: item.orgId,
      clientTokenId: item.clientTokenId,
      appId: item.item.appId,
      idempotencyKey: item.item.idempotencyKey ?? item.fmdxIdempotencyKey,
    })),
  });
  const newCallbacksMap = new Map(
    newCallbacks.map(item => [item.idempotencyKey, item]),
  );

  batch.forEach(item => {
    const idempotencyKey = item.item.idempotencyKey ?? item.fmdxIdempotencyKey;
    const callback =
      newCallbacksMap.get(idempotencyKey) ??
      existingCallbacksMap.get(idempotencyKey);

    if (callback) {
      item.resolve(callback);
    } else {
      item.reject(
        new OwnServerError(
          'Error adding callback',
          kOwnServerErrorCodes.InternalServerError,
        ),
      );
    }
  });

  isProcessing = false;
  kPromiseStore.callAndForget(processNextCallbacksBatch);
}

const inputSchema = z.object({
  item: addCallbackSchema,
  orgId: z.string(),
  clientTokenId: z.string(),
  idempotencyKey: z.string(),
});

export async function addCallbackEndpoint(req: Request, res: Response) {
  const params = inputSchema.parse(req.body);
  const promise = getDeferredPromise<ICallback>();
  kAddCallbackQueue.push({
    orgId: params.orgId,
    clientTokenId: params.clientTokenId,
    item: params.item,
    resolve: promise.resolve,
    reject: promise.reject,
    fmdxIdempotencyKey: params.idempotencyKey,
  });

  kPromiseStore.callAndForget(processNextCallbacksBatch);

  try {
    const callback = await promise.promise;
    addCallbackToStore({
      id: callback.id,
      timeoutDate: callback.timeout ? new Date(callback.timeout) : undefined,
      intervalFrom: callback.intervalFrom
        ? new Date(callback.intervalFrom)
        : undefined,
      intervalMs: callback.intervalMs,
    });

    const response: IAddCallbackHttpOutgoingSuccessResponse = {
      type: 'success',
      callback,
    };

    res.status(200).send(response);
  } catch (error: unknown) {
    const code = OwnServerError.isOwnServerError(error)
      ? error.statusCode
      : kOwnServerErrorCodes.InternalServerError;
    const response: IHttpOutgoingErrorResponse = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(code).send(response);
  }
}
