import { FimidxEndpoints } from 'fimidx';
import Transport, { default as TransportStream } from 'winston-transport';

export interface IFimidxWinstonTransportOptions
  extends TransportStream.TransportStreamOptions {
  appId: string;
  clientToken: string;
  serverURL?: string;
}

export class FimidxWinstonTransport extends Transport {
  protected readonly appId: string;
  protected readonly clientToken: string;
  protected readonly serverURL?: string;
  protected fimidx: FimidxEndpoints;

  constructor(opts: IFimidxWinstonTransportOptions) {
    super(opts);
    this.appId = opts.appId;
    this.clientToken = opts.clientToken;
    this.serverURL = opts.serverURL;
    this.fimidx = new FimidxEndpoints({
      authToken: this.clientToken,
      serverURL: this.serverURL,
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    info = typeof info === 'object' ? info : {message: info};

    // TODO: batch logs
    this.sendLogs({logs: [info]}).finally(() => {
      callback();
    });
  }

  protected async sendLogs(params: {
    logs: any[];
    consoleLogOnError?: boolean;
    throwOnError?: boolean;
  }) {
    const {logs, consoleLogOnError = true, throwOnError = false} = params;

    console.log("sendLogs", logs);
    console.log("this.serverURL", this.serverURL);

    try {
      await this.fimidx.logs.ingestLogs(
        {appId: this.appId, logs},
        {serverURL: this.serverURL, authToken: this.clientToken},
      );
    } catch (error) {
      if (throwOnError) {
        throw error;
      }

      if (consoleLogOnError) {
        console.error(error);
        logs.map(console.log.bind(console));
      }
    }
  }
}
