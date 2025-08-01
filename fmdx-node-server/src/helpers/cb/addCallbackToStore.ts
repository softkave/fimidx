import {kCallbackStore} from '../../ctx/callback.js';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {executeCallback} from './executeCallback.js';

export function addCallbackToStore(params: {
  id: string;
  timeoutDate?: Date | null;
  intervalFrom?: Date | null;
  intervalMs?: number | null;
}) {
  // TODO: implement timeout packing

  if (kCallbackStore[params.id]) {
    console.log('Callback already exists', params.id);
    return;
  }

  if (params.timeoutDate) {
    kCallbackStore[params.id] = {
      id: params.id,
      timeoutHandle: setTimeout(() => {
        delete kCallbackStore[params.id];
        kPromiseStore.callAndForget(() =>
          executeCallback({callbackId: params.id}),
        );
      }, params.timeoutDate.getTime() - Date.now()),
    };
  } else if (params.intervalMs && params.intervalFrom) {
    const now = new Date();
    const adder = () => {
      kCallbackStore[params.id] = {
        id: params.id,
        intervalHandle: setInterval(() => {
          kPromiseStore.callAndForget(() =>
            executeCallback({callbackId: params.id}),
          );
        }, params.intervalMs!),
      };
    };

    console.log('Adding callback to store', {
      id: params.id,
      intervalFrom: params.intervalFrom,
      now,
    });

    if (params.intervalFrom > now) {
      setTimeout(adder, params.intervalFrom.getTime() - now.getTime());
    } else {
      adder();
    }
  }
}
