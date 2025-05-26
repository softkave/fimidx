import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";
import type { AddCallbackEndpointArgs } from "../../definitions/callback.js";

export async function addCallback(params: {
  args: AddCallbackEndpointArgs;
  appId: string;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, appId, orgId, clientTokenId } = params;
  const {
    url,
    method,
    requestHeaders,
    requestBody,
    timeout,
    intervalFrom,
    intervalMs,
    idempotencyKey,
  } = args;
  const date = new Date();
  const newCallback: typeof callbackTable.$inferInsert = {
    appId,
    url,
    method,
    requestHeaders,
    requestBody,
    createdAt: date,
    updatedAt: date,
    orgId,
    clientTokenId,
    timeout: timeout ? new Date(timeout) : null,
    intervalFrom: intervalFrom ? new Date(intervalFrom) : null,
    intervalMs,
    idempotencyKey,
  };

  const [callback] = await db
    .insert(callbackTable)
    .values(newCallback)
    .returning();

  return callback;
}

export async function addCallbackBatch(params: {
  args: Array<
    AddCallbackEndpointArgs & {
      orgId: string;
      clientTokenId: string;
      appId: string;
    }
  >;
}) {
  const { args } = params;
  if (args.length === 0) {
    return [];
  }

  const date = new Date();
  const newCallbacks = args.map((arg): typeof callbackTable.$inferInsert => ({
    appId: arg.appId,
    url: arg.url,
    method: arg.method,
    requestHeaders: arg.requestHeaders,
    requestBody: arg.requestBody,
    createdAt: date,
    updatedAt: date,
    orgId: arg.orgId,
    clientTokenId: arg.clientTokenId,
    timeout: arg.timeout ? new Date(arg.timeout) : null,
    intervalFrom: arg.intervalFrom
      ? new Date(arg.intervalFrom)
      : arg.intervalMs
      ? new Date()
      : null,
    intervalMs: arg.intervalMs,
    idempotencyKey: arg.idempotencyKey,
  }));

  const callbacks = await db
    .insert(callbackTable)
    .values(newCallbacks)
    .returning();

  return callbacks;
}
