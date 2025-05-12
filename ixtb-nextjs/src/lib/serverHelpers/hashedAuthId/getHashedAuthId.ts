import { db, hashedAuthIds as hashedAuthIdTable } from "@/src/db/fmlogs-schema";
import { GetHashedAuthIdEndpointArgs } from "@/src/definitions/websocket";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

async function getHashedAuthIdByID(id: string) {
  const [hashedAuthId] = await db
    .select()
    .from(hashedAuthIdTable)
    .where(eq(hashedAuthIdTable.id, id));
  return hashedAuthId;
}

async function getHashedAuthIdByHashedAuthId(params: {
  hashedAuthId: string;
  appId: string;
}) {
  const { hashedAuthId, appId } = params;
  const [returnedHashedAuthId] = await db
    .select()
    .from(hashedAuthIdTable)
    .where(
      and(
        eq(hashedAuthIdTable.hashedAuthId, hashedAuthId),
        eq(hashedAuthIdTable.appId, appId)
      )
    );
  return returnedHashedAuthId;
}

export async function tryGetHashedAuthId(params: GetHashedAuthIdEndpointArgs) {
  const { id, hashedAuthId, appId } = params;

  assert(
    id || (hashedAuthId && appId),
    new OwnServerError(
      "Invalid request, id or (hashedAuthId and appId) is required",
      400
    )
  );

  let returnedHashedAuthId: typeof hashedAuthIdTable.$inferSelect | null = null;

  if (id) {
    returnedHashedAuthId = await getHashedAuthIdByID(id);
  } else if (hashedAuthId && appId) {
    returnedHashedAuthId = await getHashedAuthIdByHashedAuthId({
      hashedAuthId,
      appId,
    });
  }

  return returnedHashedAuthId;
}

export async function getHashedAuthId(params: GetHashedAuthIdEndpointArgs) {
  const hashedAuthId = await tryGetHashedAuthId(params);
  assert(hashedAuthId, new OwnServerError("Hashed auth ID not found", 404));
  return hashedAuthId;
}
