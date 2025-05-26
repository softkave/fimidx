import { and, eq } from "drizzle-orm";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";
import type { DeleteCallbackEndpointArgs } from "../../definitions/callback.js";

export async function deleteCallback(params: DeleteCallbackEndpointArgs) {
  const { id, idempotencyKey, appId, acknowledgeDeleteAllForApp } = params;
  const where = [];
  if (id) {
    where.push(eq(callbackTable.id, id));
  }
  if (idempotencyKey && appId) {
    where.push(
      and(
        eq(callbackTable.idempotencyKey, idempotencyKey),
        eq(callbackTable.appId, appId)
      )
    );
  }
  if (appId && acknowledgeDeleteAllForApp) {
    where.push(eq(callbackTable.appId, appId));
  }
  if (where.length === 0) {
    throw new OwnServerError(
      "No callback to delete provided",
      kOwnServerErrorCodes.InvalidRequest
    );
  }
  await db.delete(callbackTable).where(and(...where));
}
