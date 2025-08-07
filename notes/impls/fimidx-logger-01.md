# fimidx-logger-01

## Overview

A generic buffered logger that sends log entries to a remote fimidx server with configurable buffering, retry logic, and fallback mechanisms.

## Core Requirements

### Basic Functionality

- Generic logger that doesn't care about log levels
- Provides `log()` function that takes any object
- Provides `logList()` function that takes an array of objects
- Can be instantiated with extra metadata that gets included in every log entry (for tagging, environment, etc.)

### Buffering & Batching

- Buffers entries before sending to remote server
- Configurable buffer timeout (default: 1000ms)
- Configurable maximum buffer size (default: 100 entries)
- Does not refresh buffer until successfully drained to remote or console

### Error Handling & Retry Logic

- Retries failed remote sends with exponential backoff
- Configurable retry attempts (default: 3)
- Configurable retry delay (default: 1000ms, doubles on each retry)
- If configured, logs to console after max retries exceeded
- If configured, logs remote errors when sending fails

## Implementation Specification

### Class Structure

```typescript
export interface IFimidxLoggerOptions {
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

export class FimidxLogger {
  private readonly appId: string;
  private readonly clientToken: string;
  private readonly serverURL?: string;
  private readonly fimidx: FimidxEndpoints;

  // Buffering
  private buffer: any[] = [];
  private bufferTimeout: number;
  private maxBufferSize: number;
  private flushTimer?: NodeJS.Timeout;

  // Retry configuration
  private maxRetries: number;
  private retryDelay: number;

  // Fallback configuration
  private consoleLogOnError: boolean;
  private logRemoteErrors: boolean;

  // Metadata
  private metadata?: Record<string, any>;

  constructor(opts: IFimidxLoggerOptions) {
    // Initialize properties from options
    // Set up FimidxEndpoints instance
    // Validate required parameters
  }

  // Public API
  log(entry: any): void;
  logList(entries: any[]): void;
  flush(): Promise<void>;
  close(): Promise<void>;

  // Private methods
  private addToBuffer(entry: any): void;
  private scheduleFlush(): void;
  private async flushBuffer(): Promise<void>;
  private async sendLogs(logs: any[]): Promise<void>;
  private async retrySend(logs: any[], attempt: number): Promise<void>;
}
```

### Constructor Implementation

```typescript
constructor(opts: IFimidxLoggerOptions) {
  // Validate required parameters
  if (!opts.appId) throw new Error('appId is required');
  if (!opts.clientToken) throw new Error('clientToken is required');

  // Initialize properties
  this.appId = opts.appId;
  this.clientToken = opts.clientToken;
  this.serverURL = opts.serverURL;

  // Buffering defaults
  this.bufferTimeout = opts.bufferTimeout ?? 1000;
  this.maxBufferSize = opts.maxBufferSize ?? 100;

  // Retry defaults
  this.maxRetries = opts.maxRetries ?? 3;
  this.retryDelay = opts.retryDelay ?? 1000;

  // Fallback defaults
  this.consoleLogOnError = opts.consoleLogOnError ?? true;
  this.logRemoteErrors = opts.logRemoteErrors ?? false;

  // Metadata
  this.metadata = opts.metadata;

  // Initialize FimidxEndpoints
  this.fimidx = new FimidxEndpoints({
    authToken: this.clientToken,
    serverURL: this.serverURL,
  });
}
```

### Public API Methods

#### `log(entry: any): void`

- Adds entry to buffer with metadata
- Schedules flush if not already scheduled
- Triggers immediate flush if buffer is full

#### `logList(entries: any[]): void`

- Adds all entries to buffer with metadata
- Schedules flush if not already scheduled
- Triggers immediate flush if buffer is full

#### `flush(): Promise<void>`

- Immediately flushes buffer to remote server
- Returns promise that resolves when flush completes

#### `close(): Promise<void>`

- Flushes any remaining entries
- Clears any pending timers
- Returns promise that resolves when close completes

### Private Implementation Methods

#### `addToBuffer(entry: any): void`

- Merges entry with metadata
- Adds to buffer array
- Checks if buffer is full and triggers immediate flush

#### `scheduleFlush(): void`

- Clears existing timer if present
- Sets new timer to flush buffer after timeout

#### `flushBuffer(): Promise<void>`

- Clears flush timer
- If buffer is empty, returns immediately
- Takes current buffer contents and clears buffer
- Calls `sendLogs()` with buffer contents
- Handles any errors and retries if needed

#### `sendLogs(logs: any[]): Promise<void>`

- Attempts to send logs to remote server
- Uses retry logic with exponential backoff
- Falls back to console logging if configured
- Logs remote errors if configured

#### `retrySend(logs: any[], attempt: number): Promise<void>`

- Implements exponential backoff retry logic
- Calls remote endpoint with retry attempt tracking
- Throws error if max retries exceeded

### Error Handling Strategy

1. **Network Errors**: Retry with exponential backoff
2. **Authentication Errors**: Fail immediately, don't retry
3. **Server Errors (5xx)**: Retry with exponential backoff
4. **Client Errors (4xx)**: Fail immediately, don't retry
5. **Max Retries Exceeded**: Log to console if configured
6. **Remote Error Logging**: Log error details if configured

### Usage Example

```typescript
const logger = new FimidxLogger({
  appId: "my-app",
  clientToken: "token123",
  serverURL: "https://fimidx.example.com",
  bufferTimeout: 2000,
  maxBufferSize: 50,
  maxRetries: 5,
  metadata: {
    environment: "production",
    version: "1.0.0",
    service: "user-service",
  },
});

// Single log entry
logger.log({ level: "info", message: "User logged in", userId: 123 });

// Multiple log entries
logger.logList([
  { level: "error", message: "Database connection failed" },
  { level: "warn", message: "High memory usage detected" },
]);

// Force flush
await logger.flush();

// Close logger
await logger.close();
```

### Integration with Winston Transport

The logger can be easily adapted to work as a Winston transport by implementing the Winston transport interface:

```typescript
export class FimidxWinstonTransport extends Transport {
  private logger: FimidxLogger;

  constructor(opts: IFimidxWinstonTransportOptions) {
    super(opts);
    this.logger = new FimidxLogger({
      appId: opts.appId,
      clientToken: opts.clientToken,
      serverURL: opts.serverURL,
      // ... other options
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    this.logger.log(info);
    callback();
  }
}
```
