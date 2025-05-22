import {FmdxEndpointsBase} from '../utils/FmdxEndpointsBase.js';
import type {FmdxEndpointOpts} from '../utils/types.js';
import type {
  AddCallbackEndpointParams,
  DeleteCallbackEndpointParams,
  IAddCallbackEndpointResult,
} from './callbackTypes.js';

export class FmdxCallbacksEndpoints extends FmdxEndpointsBase {
  addCallback = async (
    props?: AddCallbackEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<IAddCallbackEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/callbacks',
        method: 'POST',
      },
      opts,
    );
  };
  deleteCallback = async (
    props?: DeleteCallbackEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<void> => {
    await this.executeJson(
      {
        data: props,
        path: '/callbacks',
        method: 'DELETE',
      },
      opts,
    );
  };
}
