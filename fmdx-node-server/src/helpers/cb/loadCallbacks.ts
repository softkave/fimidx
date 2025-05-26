import {getCallbacksForInternalUse} from 'fmdx-core/serverHelpers/callback/getCallbacks';
import {addCallbackToStore} from './addCallbackToStore.js';

export async function loadCallbacks() {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const callbacks = await getCallbacksForInternalUse({
      pageNumber: page,
      limitNumber: 100,
    });

    if (callbacks.length === 0) {
      hasMore = false;
    } else {
      for (const callback of callbacks) {
        const timeoutDate = callback.timeout
          ? new Date(callback.timeout)
          : undefined;
        const intervalFrom = callback.intervalFrom
          ? new Date(callback.intervalFrom)
          : undefined;
        let isValid = false;

        if (timeoutDate && timeoutDate < new Date()) {
          isValid = true;
        } else if (intervalFrom && intervalFrom < new Date()) {
          isValid = true;
        }

        if (isValid) {
          addCallbackToStore({
            id: callback.id,
            timeoutDate,
            intervalFrom,
            intervalMs: callback.intervalMs,
          });
        }
      }

      page++;
    }
  }
}
