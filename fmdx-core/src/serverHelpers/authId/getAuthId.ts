import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { authIds as authIdTable, db } from "../../db/fmdx-schema.js";
import type { GetAuthIdEndpointArgs } from "../../definitions/webSockets.js";

async function getAuthIdByID(id: string) {
  const [authId] = await db
    .select()
    .from(authIdTable)
    .where(eq(authIdTable.id, id));
  return authId;
}

async function getAuthIdByAuthId(params: { authId: string; appId: string }) {
  const { authId, appId } = params;
  const [returnedAuthId] = await db
    .select()
    .from(authIdTable)
    .where(and(eq(authIdTable.authId, authId), eq(authIdTable.appId, appId)));
  return returnedAuthId;
}

export async function tryGetAuthId(params: GetAuthIdEndpointArgs) {
  const { id, authId, appId } = params;

  let returnedAuthId: typeof authIdTable.$inferSelect | null = null;

  if (id) {
    returnedAuthId = await getAuthIdByID(id);
  } else if (authId && appId) {
    returnedAuthId = await getAuthIdByAuthId({
      authId,
      appId,
    });
  }

  return returnedAuthId;
}

export async function getAuthId(params: GetAuthIdEndpointArgs) {
  const { id, authId, appId } = params;
  assert(
    id || (authId && appId),
    new OwnServerError(
      "Invalid request, id or (authId and appId) is required",
      400
    )
  );

  const returnedAuthId = await tryGetAuthId(params);
  assert(returnedAuthId, new OwnServerError("Hashed auth ID not found", 404));
  return returnedAuthId;
}
