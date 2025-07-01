import type {
  AddCallbackEndpointArgs,
  IAddCallbackEndpointResponse,
} from 'fmdx-core/definitions/index';
import {mfdocConstruct, MfdocHttpEndpointMethod} from 'mfdoc';
import {kTags} from '../tags.js';
import {kAppId} from '../utils.js';
import {
  kCallback,
  kCallbackIdempotencyKey,
  kCallbackIntervalFrom,
  kCallbackIntervalMs,
  kCallbackMethod,
  kCallbackRequestHeaders,
  kCallbackTimeout,
  kCallbackUrl,
} from './utils.js';

export const addCallbackHttpEndpoint =
  mfdocConstruct.constructHttpEndpointDefinition({
    path: '/callbacks',
    method: MfdocHttpEndpointMethod.Post,
    name: 'fmdx/callbacks/addCallback',
    description: 'Add a callback request',
    tags: [kTags.public],
    responseBody: mfdocConstruct.constructObject<IAddCallbackEndpointResponse>({
      name: 'AddCallbackResponse',
      fields: {
        callback: mfdocConstruct.constructObjectField({
          required: true,
          data: kCallback,
        }),
      },
    }),
    requestBody: mfdocConstruct.constructObject<AddCallbackEndpointArgs>({
      name: 'AddCallbackRequestArgs',
      fields: {
        appId: mfdocConstruct.constructObjectField({
          required: true,
          data: kAppId,
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
          required: false,
          data: kCallbackRequestHeaders,
        }),
        requestBody: mfdocConstruct.constructObjectField({
          required: false,
          data: mfdocConstruct.constructString({
            description: 'The body to send with the request',
          }),
        }),
        timeout: mfdocConstruct.constructObjectField({
          required: false,
          data: kCallbackTimeout,
        }),
        intervalFrom: mfdocConstruct.constructObjectField({
          required: false,
          data: kCallbackIntervalFrom,
        }),
        intervalMs: mfdocConstruct.constructObjectField({
          required: false,
          data: kCallbackIntervalMs,
        }),
        idempotencyKey: mfdocConstruct.constructObjectField({
          required: false,
          data: kCallbackIdempotencyKey,
        }),
      },
    }),
  });
