import {kCallbackStore} from '../../ctx/callbackStore.js';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {executeCallback} from './executeCallback.js';

export function addCallback(params: {id: string; timeoutDate: Date}) {
  // TODO: implement timeout packing
  kCallbackStore[params.id] = {
    id: params.id,
    handle: setTimeout(() => {
      delete kCallbackStore[params.id];
      kPromiseStore.callAndForget(() =>
        executeCallback({callbackId: params.id}),
      );
    }, params.timeoutDate.getTime() - Date.now()),
  };
}
