import {kId0} from 'fmdx-core/definitions/system';
import {getCallbacks} from 'fmdx-core/serverHelpers/index';
import {first} from 'lodash-es';
import {addCallbackEndpointImpl} from '../../httpEndpoints/cbs/addCallbackEndpoint.js';
import {getConfig} from '../../utils/config.js';
import {kInternalAccessKeyHeader} from '../../httpServer.js';

export async function setupIndexObjsCallback() {
  const name = '__fmdx_indexObjs_callback';
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

  const {internalAccessKey, indexObjsIntervalMs, indexObjsUrl} = getConfig();

  await addCallbackEndpointImpl({
    clientTokenId: kId0,
    groupId: kId0,
    item: {
      appId: kId0,
      url: indexObjsUrl,
      method: 'POST',
      requestHeaders: {
        [kInternalAccessKeyHeader]: internalAccessKey,
      },
      intervalFrom: new Date().toISOString(),
      intervalMs: indexObjsIntervalMs,
      idempotencyKey: name,
      name,
    },
  });
}
