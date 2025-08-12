import { FimidxLogger, IFimidxLoggerOptions } from 'fimidx';
import Transport, { default as TransportStream } from 'winston-transport';

export interface IFimidxWinstonTransportOptions
  extends TransportStream.TransportStreamOptions {
  appId: string;
  clientToken: string;
  serverURL?: string;

  // Buffering options
  bufferTimeout?: number; // ms, default: 1000
  maxBufferSize?: number; // default: 100

  // Retry options
  maxRetries?: number; // default: 3
  retryDelay?: number; // ms, default: 1000

  // Fallback options
  consoleLogOnError?: boolean; // default: true
  logRemoteErrors?: boolean; // default: false

  // Metadata to include in every log entry
  metadata?: Record<string, any>;
}

export class FimidxWinstonTransport extends Transport {
  private logger: FimidxLogger;

  constructor(opts: IFimidxWinstonTransportOptions) {
    super(opts);
    
    // Create FimidxLogger instance with Winston transport options
    const loggerOptions: IFimidxLoggerOptions = {
      appId: opts.appId,
      clientToken: opts.clientToken,
      serverURL: opts.serverURL,
      bufferTimeout: opts.bufferTimeout,
      maxBufferSize: opts.maxBufferSize,
      maxRetries: opts.maxRetries,
      retryDelay: opts.retryDelay,
      consoleLogOnError: opts.consoleLogOnError,
      logRemoteErrors: opts.logRemoteErrors,
      metadata: opts.metadata,
    };

    this.logger = new FimidxLogger(loggerOptions);
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Ensure info is an object
    info = typeof info === 'object' ? info : { message: info };

    // Use the buffered logger
    this.logger.log(info);
    
    callback();
  }

  // Expose flush method for Winston transport
  async flush(): Promise<void> {
    return this.logger.flush();
  }

  // Expose close method for Winston transport
  async close(): Promise<void> {
    return this.logger.close();
  }
}
