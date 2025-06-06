// This file is auto-generated, do not modify directly.
// Reach out to a code owner to suggest changes.

export type CallbackRequestHeaders = {};
export type AddCallbackRequestArgs = {
  appId: string;
  url: string;
  method: string;
  requestHeaders?: CallbackRequestHeaders;
  requestBody?: string;
  timeout?: string | number | null;
  intervalFrom?: string | number | null;
  intervalMs?: number | null;
  idempotencyKey?: string | null;
};
export type CallbackResponseHeaders = {};
export type Callback = {
  id: string;
  createdAt: string | number;
  updatedAt: string | number;
  groupId: string;
  appId: string;
  clientTokenId: string;
  url: string;
  method: string;
  requestHeaders: CallbackRequestHeaders | null;
  requestBody: string | null;
  error: string | null;
  responseHeaders: CallbackResponseHeaders | null;
  responseBody: string | null;
  responseStatusCode: number | null;
  executedAt: string | number | null;
  timeout: string | number | null;
  intervalFrom: string | number | null;
  intervalMs: number | null;
  idempotencyKey: string | null;
};
export type AddCallbackResponse = {
  callback: Callback;
};
export type DeleteCallbackRequestArgs = {
  id?: string;
  idempotencyKey?: string | null;
  appId?: string;
  acknowledgeDeleteAllForApp?: boolean;
};
export type InputLogRecord = {};
export type IngestLogsArgs = {
  appId: string;
  logs: Array<InputLogRecord>;
};
