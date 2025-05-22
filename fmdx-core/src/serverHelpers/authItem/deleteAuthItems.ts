import { and, eq, SQL } from "drizzle-orm";
import {
  connectedAuthItems as connectedAuthItemTable,
  db,
} from "../../db/fmdx-schema.js";
import type { DeleteAuthItemEndpointArgs } from "../../definitions/webSockets.js";

export async function deleteAuthItem(params: DeleteAuthItemEndpointArgs) {
  const {
    id,
    acknowledgeDeleteAllInApp,
    appId,
    acknowledgeDeleteAllForAuthId,
    authId,
  } = params;

  let query: SQL | undefined;

  if (id) {
    query = eq(connectedAuthItemTable.id, id);
  } else if (authId && appId && acknowledgeDeleteAllForAuthId) {
    query = and(
      eq(connectedAuthItemTable.authId, authId),
      eq(connectedAuthItemTable.appId, appId)
    );
  } else if (appId && acknowledgeDeleteAllInApp) {
    query = eq(connectedAuthItemTable.appId, appId);
  }

  if (query) {
    await db.delete(connectedAuthItemTable).where(query);
  }
}
