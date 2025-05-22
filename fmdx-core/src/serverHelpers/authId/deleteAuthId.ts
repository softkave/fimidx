import { eq } from "drizzle-orm";
import { authIds as authIdTable, db } from "../../db/fmdx-schema.js";
import type { DeleteAuthIdEndpointArgs } from "../../definitions/webSockets.js";
import { tryGetAuthId } from "./getAuthId.js";

export async function deleteAuthId(params: DeleteAuthIdEndpointArgs) {
  const { id, appId, authId, acknowledgeDeleteAllInApp } = params;

  if (id || (authId && appId)) {
    const returnedAuthId = await tryGetAuthId({
      id,
      authId,
      appId,
    });

    if (returnedAuthId) {
      await db.delete(authIdTable).where(eq(authIdTable.id, returnedAuthId.id));
    }
  } else if (appId && acknowledgeDeleteAllInApp) {
    await db.delete(authIdTable).where(eq(authIdTable.appId, appId));
  }
}
