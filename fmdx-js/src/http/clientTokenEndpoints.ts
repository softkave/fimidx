import {FmdxEndpointsBase} from '../utils/FmdxEndpointsBase.js';
import type {FmdxEndpointOpts} from '../utils/types.js';
import type {
  RefreshClientTokenJWTEndpointParams,
  RefreshClientTokenJWTEndpointResult,
} from './clientTokenTypes.js';

export class FmdxClientTokenEndpoints extends FmdxEndpointsBase {
  refreshClientToken = async (
    props?: RefreshClientTokenJWTEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<RefreshClientTokenJWTEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/client-tokens/refresh',
        method: 'POST',
      },
      opts,
    );
  };
}
