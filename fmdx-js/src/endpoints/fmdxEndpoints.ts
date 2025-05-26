// This file is auto-generated, do not modify directly.
// Reach out to a code owner to suggest changes.

import {
  MfdocEndpointsBase,
  type MfdocEndpointResultWithBinaryResponse,
  type MfdocEndpointOpts,
  type MfdocEndpointDownloadBinaryOpts,
  type MfdocEndpointUploadBinaryOpts,
} from 'mfdoc-js-sdk-base';
import {
  type AddCallbackRequestArgs,
  type AddCallbackResponse,
  type DeleteCallbackRequestArgs,
  type IngestLogsArgs,
} from './fmdxTypes.js';

export class CallbacksEndpoints extends MfdocEndpointsBase {
  addCallback = async (
    props: AddCallbackRequestArgs,
    opts?: MfdocEndpointOpts,
  ): Promise<AddCallbackResponse> => {
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
    props?: DeleteCallbackRequestArgs,
    opts?: MfdocEndpointOpts,
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/callbacks',
        method: 'DELETE',
      },
      opts,
    );
  };
}
export class LogsEndpoints extends MfdocEndpointsBase {
  ingestLogs = async (
    props: IngestLogsArgs,
    opts?: MfdocEndpointOpts,
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/logs/ingest',
        method: 'POST',
      },
      opts,
    );
  };
}
export class FmdxEndpoints extends MfdocEndpointsBase {
  callbacks = new CallbacksEndpoints(this.config, this);
  logs = new LogsEndpoints(this.config, this);
}
