# FimidxLogger

A generic buffered logger that sends log entries to a remote fimidx server with configurable buffering, retry logic, and fallback mechanisms.

## Features

- **Generic logging**: Doesn't care about log levels - accepts any object
- **Buffering & batching**: Buffers entries before sending to remote server
- **Retry logic**: Exponential backoff retry with configurable attempts
- **Fallback mechanisms**: Console logging when remote sending fails
- **Metadata support**: Include extra metadata in every log entry

## Basic Usage

```typescript
import {FimidxLogger} from '@fimidx/logger';

const logger = new FimidxLogger({
  appId: 'my-app',
  clientToken: 'your-client-token',
  serverURL: 'https://fimidx.example.com', // optional, defaults to https://dx.fimidara.com/api
});

// Single log entry
logger.log({level: 'info', message: 'User logged in', userId: 123});

// Multiple log entries
logger.logList([
  {level: 'error', message: 'Database connection failed'},
  {level: 'warn', message: 'High memory usage detected'},
]);

// Force flush
await logger.flush();

// Close logger (flushes remaining entries)
await logger.close();
```

## Configuration Options

```typescript
const logger = new FimidxLogger({
  appId: 'my-app',
  clientToken: 'your-client-token',

  // Buffering options
  bufferTimeout: 2000, // ms, default: 1000
  maxBufferSize: 50, // default: 100

  // Retry options
  maxRetries: 5, // default: 3
  retryDelay: 1000, // ms, default: 1000 (doubles on each retry)

  // Fallback options
  consoleLogOnError: true, // default: true
  logRemoteErrors: false, // default: false

  // Metadata to include in every log entry
  metadata: {
    environment: 'production',
    version: '1.0.0',
    service: 'user-service',
  },
});
```

## Error Handling

The logger implements intelligent error handling:

- **Network errors**: Retry with exponential backoff
- **Authentication errors (401)**: Fail immediately, don't retry
- **Server errors (5xx)**: Retry with exponential backoff
- **Client errors (4xx)**: Fail immediately, don't retry (except 429)
- **Max retries exceeded**: Log to console if configured
- **Remote error logging**: Log error details if configured

## Buffering Behavior

- Logs are buffered until `bufferTimeout` is reached or `maxBufferSize` is exceeded
- Buffer is not refreshed until successfully drained to remote or console
- `flush()` immediately sends all buffered logs
- `close()` flushes remaining logs and clears timers

## API Reference

### FimidxLogger

#### Constructor

```typescript
new FimidxLogger(options: IFimidxLoggerOptions)
```

#### Methods

- `log(entry: any): void` - Add single log entry
- `logList(entries: any[]): void` - Add multiple log entries
- `flush(): Promise<void>` - Immediately flush buffer
- `close(): Promise<void>` - Flush remaining entries and close

## Types

```typescript
interface IFimidxLoggerOptions {
  appId: string;
  clientToken: string;
  serverURL?: string;
  bufferTimeout?: number;
  maxBufferSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  consoleLogOnError?: boolean;
  logRemoteErrors?: boolean;
  metadata?: Record<string, any>;
}
```
