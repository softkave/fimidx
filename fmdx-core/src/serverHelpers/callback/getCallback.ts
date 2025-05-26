import { and, eq } from "drizzle-orm";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";
import type {
  GetCallbackEndpointArgs,
  ICallback,
} from "../../definitions/callback.js";

export async function getCallback(
  params: GetCallbackEndpointArgs & {
    throwIfNotFound?: boolean;
  }
): Promise<ICallback> {
  const { id, idempotencyKey, appId, throwIfNotFound = true } = params;

  if (id) {
    const [callback] = await db
      .select()
      .from(callbackTable)
      .where(eq(callbackTable.id, id))
      .limit(1);

    if (!callback && throwIfNotFound) {
      throw new OwnServerError(
        "Callback not found",
        kOwnServerErrorCodes.NotFound
      );
    }

    return callback;
  } else if (appId && idempotencyKey) {
    const [callback] = await db
      .select()
      .from(callbackTable)
      .where(
        and(
          eq(callbackTable.appId, appId),
          eq(callbackTable.idempotencyKey, idempotencyKey)
        )
      )
      .limit(1);

    if (!callback && throwIfNotFound) {
      throw new OwnServerError(
        "Callback not found",
        kOwnServerErrorCodes.NotFound
      );
    }

    return callback;
  }

  throw new OwnServerError(
    "Invalid parameters",
    kOwnServerErrorCodes.InvalidRequest
  );
}
