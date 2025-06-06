import {kId0} from 'fmdx-core/definitions/system';
import {getCallbacks} from 'fmdx-core/serverHelpers/index';
import {first} from 'lodash-es';
import {addCallbackEndpointImpl} from '../../httpEndpoints/cbs/addCallbackEndpoint.js';
import {getConfig} from '../../utils/config.js';

export async function setupCleanupObjsCallback() {
  const name = '__fmdx_cleanupObjs_callback';
  const {callbacks} = await getCallbacks({
    args: {
      query: {
        appId: kId0,
        name: {
          eq: name,
        },
      },
      limit: 1,
    },
  });

  const callback = first(callbacks);

  if (callback) {
    return;
  }

  const {
    cleanupObjsApiKey,
    cleanupObjsApiKeyHeader,
    cleanupObjsIntervalMs,
    cleanupObjsUrl,
  } = getConfig();

  await addCallbackEndpointImpl({
    clientTokenId: kId0,
    groupId: kId0,
    idempotencyKey: name,
    item: {
      appId: kId0,
      url: cleanupObjsUrl,
      method: 'POST',
      requestHeaders: {
        [cleanupObjsApiKeyHeader]: cleanupObjsApiKey,
        'Content-Type': 'application/json',
      },
      intervalFrom: new Date().toISOString(),
      intervalMs: cleanupObjsIntervalMs,
    },
  });
}
