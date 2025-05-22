import {FmdxEndpointsBase} from '../utils/FmdxEndpointsBase.js';
import type {FmdxEndpointOpts} from '../utils/types.js';
import type {IngestLogsEndpointParams} from './logTypes.js';

export class FmdxLogsEndpoints extends FmdxEndpointsBase {
  ingestLogs = async (
    props?: IngestLogsEndpointParams,
    opts?: FmdxEndpointOpts,
  ): Promise<void> => {
    await this.executeJson(
      {
        data: props,
        path: '/logs/ingest',
        method: 'POST',
      },
      opts,
    );
  };
}
