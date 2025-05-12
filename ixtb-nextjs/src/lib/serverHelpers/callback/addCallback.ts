import { callbacks as callbackTable, db } from "@/src/db/fmlogs-schema";
import { AddCallbackEndpointArgs } from "@/src/definitions/callback";

export async function addCallback(params: {
  args: AddCallbackEndpointArgs;
  appId: string;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, appId, orgId, clientTokenId } = params;
  const { url, method, requestHeaders, requestBody } = args;
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
  };

  const [callback] = await db
    .insert(callbackTable)
    .values(newCallback)
    .returning();

  return callback;
}
