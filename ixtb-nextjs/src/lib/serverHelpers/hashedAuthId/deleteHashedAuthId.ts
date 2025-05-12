import { db, hashedAuthIds as hashedAuthIdTable } from "@/src/db/fmlogs-schema";
import { DeleteHashedAuthIdEndpointArgs } from "@/src/definitions/websocket";
import { eq } from "drizzle-orm";
import { tryGetHashedAuthId } from "./getHashedAuthId";

export async function deleteHashedAuthId(
  params: DeleteHashedAuthIdEndpointArgs
) {
  const { id, appId, hashedAuthId, acknowledgeDeleteAllInApp } = params;

  if (id || (hashedAuthId && appId)) {
    const returnedHashedAuthId = await tryGetHashedAuthId({
      id,
      hashedAuthId,
      appId,
    });

    if (returnedHashedAuthId) {
      await db
        .delete(hashedAuthIdTable)
        .where(eq(hashedAuthIdTable.id, returnedHashedAuthId.id));
    }
  } else if (appId && acknowledgeDeleteAllInApp) {
    await db
      .delete(hashedAuthIdTable)
      .where(eq(hashedAuthIdTable.appId, appId));
  }
}
