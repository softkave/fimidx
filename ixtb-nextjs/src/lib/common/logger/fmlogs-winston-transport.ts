/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  default as Transport,
  default as TransportStream,
} from "winston-transport";

export interface IFmLogsWinstonTransportOptions
  extends TransportStream.TransportStreamOptions {
  groupId: string;
  appId: string;
  clientToken: string;
  baseUrl: string;
}

interface IIngestLogsArgs {
  logs: any[];
}

async function sendLogToFmLogs(params: {
  groupId: string;
  appId: string;
  clientToken: string;
  logs: any[];
  baseUrl: string;
  consoleLogOnError?: boolean;
  throwOnError?: boolean;
}) {
  const {
    groupId,
    appId,
    clientToken,
    logs,
    baseUrl,
    consoleLogOnError = true,
    throwOnError = false,
  } = params;

  const data: IIngestLogsArgs = {
    logs,
  };

  const response = await fetch(
    `${baseUrl}/api/groups/${groupId}/apps/${appId}/logs/ingest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    if (throwOnError) {
      throw new Error(`Failed to send log to FmLogs: ${response.statusText}`);
    }

    if (consoleLogOnError) {
      console.error(`Failed to send log to FmLogs: ${response.statusText}`);
    }
  }
}

export const kFmLogsBaseUrl = "https://fmlogs.fimidara.com";

export class FmLogsWinstonTransport extends Transport {
  private readonly groupId: string;
  private readonly appId: string;
  private readonly clientToken: string;
  private readonly baseUrl: string;

  constructor(opts: IFmLogsWinstonTransportOptions) {
    super(opts);
    this.groupId = opts.groupId;
    this.appId = opts.appId;
    this.clientToken = opts.clientToken;
    this.baseUrl = opts.baseUrl;
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // TODO: batch logs
    sendLogToFmLogs({
      groupId: this.groupId,
      appId: this.appId,
      clientToken: this.clientToken,
      logs: [info],
      baseUrl: this.baseUrl,
    }).finally(() => {
      callback();
    });
  }
}
