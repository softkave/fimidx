import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";

export async function updateCallbackExecution(params: {
  callbackId: string;
  executedAt: number | Date;
  error?: string | null;
  responseHeaders?: Record<string, string> | null;
  responseBody?: string | null;
  responseStatusCode?: number | null;
}) {
  const {
    callbackId,
    executedAt,
    error,
    responseHeaders,
    responseBody,
    responseStatusCode,
  } = params;

  const updateData: Partial<typeof callbackTable.$inferInsert> = {
    // executedAt: new Date(executedAt),
  };

  if (error) updateData.error = error;
  if (responseHeaders) updateData.responseHeaders = responseHeaders;
  if (responseBody) updateData.responseBody = responseBody;
  if (responseStatusCode) updateData.responseStatusCode = responseStatusCode;

  const [callback] = await db
    .update(callbackTable)
    .set(updateData)
    .where(eq(callbackTable.id, callbackId))
    .returning();

  assert(callback, new OwnServerError("Callback not found", 404));
  return callback;
}
