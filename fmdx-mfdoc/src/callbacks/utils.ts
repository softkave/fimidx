import type {ICallback} from 'fmdx-core/definitions/callback';
import {mfdocConstruct} from 'mfdoc';
import {AnyObject} from 'softkave-js-utils';
import {
  kAppId,
  kClientTokenId,
  kDateOrNumber,
  kIso8601DateString,
  kNumberTimestamp,
  kOrgId,
} from '../utils.js';

export const kCallbackId = mfdocConstruct.constructString({
  description: 'The ID of the callback',
});

export const kCallbackIdempotencyKey = mfdocConstruct.constructOrCombination({
  description:
    'The idempotency key of the callback. ' +
    'This is used to prevent duplicate callbacks from being added. ' +
    'It can also be used to retrieve or delete a callback.',
  types: [mfdocConstruct.constructString({}), mfdocConstruct.constructNull({})],
});

export const kAcknowledgeDeleteAllForApp = mfdocConstruct.constructBoolean({
  description:
    'Whether to acknowledge the deletion of all callbacks for the app',
});

export const kCallbackUrl = mfdocConstruct.constructString({
  description: 'The URL to call when the callback is triggered',
});

export const kCallbackMethod = mfdocConstruct.constructString({
  description: 'The HTTP method to use when calling the callback',
});

export const kCallbackRequestHeaders =
  mfdocConstruct.constructObject<AnyObject>({
    name: 'CallbackRequestHeaders',
  });

export const kCallbackRequestHeadersOrNull =
  mfdocConstruct.constructOrCombination({
    description: 'The headers to send with the request',
    types: [kCallbackRequestHeaders, mfdocConstruct.constructNull({})],
  });

export const kCallbackRequestBody = mfdocConstruct.constructOrCombination({
  description: 'The body to send with the request',
  types: [mfdocConstruct.constructString({}), mfdocConstruct.constructNull({})],
});

export const kCallbackTimeout = mfdocConstruct.constructOrCombination({
  description:
    'The ISO 8601 date string or timestamp at which the callback is to be triggered. ' +
    'This is used to determine when the callback is to be triggered. ' +
    'If provided, the callback will be triggered only once, as opposed to interval-based triggering using intervalFrom and intervalMs.',
  types: [
    kIso8601DateString,
    kNumberTimestamp,
    mfdocConstruct.constructNull({}),
  ],
});

export const kCallbackIntervalFrom = mfdocConstruct.constructOrCombination({
  description:
    'The ISO 8601 date string or timestamp from which the callback is to begin being triggered. ' +
    'This is used in conjunction with the intervalMs field to determine the interval at which the callback is to be triggered. ' +
    'If intervalMs is provided and this is not provided, the current server time is used.',
  types: [
    kIso8601DateString,
    kNumberTimestamp,
    mfdocConstruct.constructNull({}),
  ],
});

export const kCallbackIntervalMs = mfdocConstruct.constructOrCombination({
  description:
    'The interval in milliseconds at which the callback is to be triggered. ' +
    'This is used in conjunction with the intervalFrom field to determine the interval at which the callback is to begin being triggered. ' +
    'If provided, the callback will be triggered continuously until the callback is deleted.',
  types: [mfdocConstruct.constructNumber({}), mfdocConstruct.constructNull({})],
});

export const kCallback = mfdocConstruct.constructObject<ICallback>({
  name: 'Callback',
  fields: {
    id: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackId,
    }),
    createdAt: mfdocConstruct.constructObjectField({
      required: true,
      data: kDateOrNumber,
    }),
    updatedAt: mfdocConstruct.constructObjectField({
      required: true,
      data: kDateOrNumber,
    }),
    orgId: mfdocConstruct.constructObjectField({
      required: true,
      data: kOrgId,
    }),
    appId: mfdocConstruct.constructObjectField({
      required: true,
      data: kAppId,
    }),
    clientTokenId: mfdocConstruct.constructObjectField({
      required: true,
      data: kClientTokenId,
    }),
    url: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackUrl,
    }),
    method: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackMethod,
    }),
    requestHeaders: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackRequestHeadersOrNull,
    }),
    requestBody: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackRequestBody,
    }),
    error: mfdocConstruct.constructObjectField({
      required: true,
      data: mfdocConstruct.constructOrCombination({
        description: 'The error message if the callback fails',
        types: [
          mfdocConstruct.constructString({}),
          mfdocConstruct.constructNull({}),
        ],
      }),
    }),
    responseHeaders: mfdocConstruct.constructObjectField({
      required: true,
      data: mfdocConstruct.constructOrCombination({
        description: 'The headers to send with the response',
        types: [
          mfdocConstruct.constructObject<AnyObject>({
            name: 'CallbackResponseHeaders',
          }),
          mfdocConstruct.constructNull({}),
        ],
      }),
    }),
    responseBody: mfdocConstruct.constructObjectField({
      required: true,
      data: mfdocConstruct.constructOrCombination({
        description: 'The body to send with the response',
        types: [
          mfdocConstruct.constructString({}),
          mfdocConstruct.constructNull({}),
        ],
      }),
    }),
    responseStatusCode: mfdocConstruct.constructObjectField({
      required: true,
      data: mfdocConstruct.constructOrCombination({
        description: 'The status code of the response',
        types: [
          mfdocConstruct.constructNumber({}),
          mfdocConstruct.constructNull({}),
        ],
      }),
    }),
    executedAt: mfdocConstruct.constructObjectField({
      required: true,
      data: mfdocConstruct.constructOrCombination({
        description: 'The date and time the callback was executed',
        types: [
          kIso8601DateString,
          kNumberTimestamp,
          mfdocConstruct.constructNull({}),
        ],
      }),
    }),
    timeout: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackTimeout,
    }),
    intervalFrom: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackIntervalFrom,
    }),
    intervalMs: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackIntervalMs,
    }),
    idempotencyKey: mfdocConstruct.constructObjectField({
      required: true,
      data: kCallbackIdempotencyKey,
    }),
  },
});
