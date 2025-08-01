// This file is auto-generated, do not modify directly.
// Reach out to a code owner to suggest changes.

import {
  type MfdocEndpointResultWithBinaryResponse,
  type MfdocEndpointOpts,
  type MfdocEndpointDownloadBinaryOpts,
  type MfdocEndpointUploadBinaryOpts,
} from 'mfdoc-js-sdk-base';
import {AbstractSdkEndpoints} from './AbstractSdkEndpoints.js';
import {type IngestLogsArgs} from './fmdxTypes.js';

export class LogsEndpoints extends AbstractSdkEndpoints {
  /**
   * Ingest logs
   */
  ingestLogs = async (
    props: IngestLogsArgs,
    opts?: MfdocEndpointOpts,
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/logs',
        method: 'POST',
      },
      opts,
    );
  };
}
export class FmdxEndpoints extends AbstractSdkEndpoints {
  logs = new LogsEndpoints(this.config, this);
}
