import {kCallbackStore} from '../../ctx/callbackStore.js';

export function removeCallback(id: string) {
  const item = kCallbackStore[id];
  if (item) {
    clearTimeout(item.handle);
    delete kCallbackStore[id];
  }
}
