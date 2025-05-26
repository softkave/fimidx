import type {DeleteCallbackEndpointArgs} from 'fmdx-core/definitions/callback';
import {mfdocConstruct, MfdocHttpEndpointMethod} from 'mfdoc';
import {kTags} from '../tags.js';
import {kAppId} from '../utils.js';
import {
  kAcknowledgeDeleteAllForApp,
  kCallbackId,
  kCallbackIdempotencyKey,
} from './utils.js';

export const deleteCallbackHttpEndpoint =
  mfdocConstruct.constructHttpEndpointDefinition({
    basePathname: '/callbacks',
    method: MfdocHttpEndpointMethod.Delete,
    name: 'fmdx/callbacks/deleteCallback',
    description: 'Delete a callback request',
    tags: [kTags.public],
    requestBody: mfdocConstruct.constructObject<DeleteCallbackEndpointArgs>({
      name: 'DeleteCallbackRequestArgs',
      fields: {
        id: mfdocConstruct.constructObjectField({
          required: false,
          data: kCallbackId,
        }),
        idempotencyKey: mfdocConstruct.constructObjectField({
          required: false,
          data: kCallbackIdempotencyKey,
        }),
        appId: mfdocConstruct.constructObjectField({
          required: false,
          data: kAppId,
        }),
        acknowledgeDeleteAllForApp: mfdocConstruct.constructObjectField({
          required: false,
          data: kAcknowledgeDeleteAllForApp,
        }),
      },
    }),
  });
