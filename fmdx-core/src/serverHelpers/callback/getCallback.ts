import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";
import type { ICallback } from "../../definitions/callback.js";

export async function getCallback(params: { id: string }): Promise<ICallback> {
  const { id } = params;

  const [callback] = await db
    .select()
    .from(callbackTable)
    .where(eq(callbackTable.id, id))
    .limit(1);

  assert(callback, new OwnServerError("Callback not found", 404));
  return callback;
}
