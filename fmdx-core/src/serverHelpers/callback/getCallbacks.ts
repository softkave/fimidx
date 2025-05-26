import assert from "assert";
import { count, eq, inArray, or } from "drizzle-orm";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import { callbacks as callbackTable, db } from "../../db/fmdx-schema.js";
import type { GetCallbacksEndpointArgs } from "../../definitions/callback.js";

async function getCallbacksFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId?: string;
  idempotencyKey?: string[];
}) {
  const { limitNumber, pageNumber, appId, idempotencyKey } = params;
  const callbacks = await db
    .select()
    .from(callbackTable)
    .where(
      or(
        appId ? eq(callbackTable.appId, appId) : undefined,
        idempotencyKey
          ? inArray(callbackTable.idempotencyKey, idempotencyKey)
          : undefined
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return callbacks;
}

async function countCallbacksInDB(params: {
  appId: string;
  idempotencyKey?: string[];
}) {
  const { appId, idempotencyKey } = params;
  const callbackCount = await db
    .select({ count: count() })
    .from(callbackTable)
    .where(
      or(
        eq(callbackTable.appId, appId),
        idempotencyKey
          ? inArray(callbackTable.idempotencyKey, idempotencyKey)
          : undefined
      )
    );

  return callbackCount[0].count;
}

export async function getCallbackList(params: {
  args: GetCallbacksEndpointArgs;
  includeCount?: boolean;
}) {
  const { args, includeCount = true } = params;
  const { page, limit, appId, idempotencyKey } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  assert(
    appId || idempotencyKey?.length,
    new OwnServerError("Invalid request", kOwnServerErrorCodes.InvalidRequest)
  );
  const [callbacks, total] = await Promise.all([
    getCallbacksFromDB({ limitNumber, pageNumber, appId, idempotencyKey }),
    includeCount ? countCallbacksInDB({ appId, idempotencyKey }) : null,
  ]);

  return {
    callbacks,
    total,
  };
}

export async function getCallbacksForInternalUse(params: {
  limitNumber: number;
  pageNumber: number;
  appId?: string;
  idempotencyKey?: string[];
}) {
  const { limitNumber, pageNumber } = params;

  const callbacks = await getCallbacksFromDB({ limitNumber, pageNumber });

  return callbacks;
}
