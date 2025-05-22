import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";
import type { AddCallbackEndpointArgs } from "../../definitions/callback.js";

export async function addCallback(params: {
  args: AddCallbackEndpointArgs;
  appId: string;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, appId, orgId, clientTokenId } = params;
  const { url, method, requestHeaders, requestBody, timeout } = args;
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
  };

  const [callback] = await db
    .insert(callbackTable)
    .values(newCallback)
    .returning();

  return callback;
}
