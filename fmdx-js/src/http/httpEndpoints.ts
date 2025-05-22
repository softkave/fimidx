import {FmdxEndpointsBase} from '../utils/FmdxEndpointsBase.js';
import {FmdxCallbacksEndpoints} from './callbackEndpoints.js';
import {FmdxLogsEndpoints} from './logEndpoints.js';
import {FmdxRoomsEndpoints} from './roomEndpoints.js';

export class FmdxHttpEndpoints extends FmdxEndpointsBase {
  callbacks = new FmdxCallbacksEndpoints(this.config, this);
  // clientTokens = new FmdxClientTokenEndpoints(this.config, this);
  logs = new FmdxLogsEndpoints(this.config, this);
  rooms = new FmdxRoomsEndpoints(this.config, this);
}
