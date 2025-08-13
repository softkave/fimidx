import { FimidxLogger } from 'fimidx';
import Transport, { default as TransportStream } from 'winston-transport';

export interface IFimidxWinstonTransportOptions
  extends TransportStream.TransportStreamOptions {
    fimidxLogger: FimidxLogger;
}

export class FimidxWinstonTransport extends Transport {
  private readonly fimidxLogger: FimidxLogger;

  constructor(opts: IFimidxWinstonTransportOptions) {
    super(opts);
    this.fimidxLogger = opts.fimidxLogger;
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Ensure info is an object
    info = typeof info === 'object' ? info : { message: info };

    // Use the buffered logger
    this.fimidxLogger.log(info);
    
    callback();
  }

  // Expose flush method for Winston transport
  async flush(): Promise<void> {
    return this.fimidxLogger.flush();
  }

  // Expose close method for Winston transport
  async close(): Promise<void> {
    return this.fimidxLogger.close();
  }
}
