import {
  connectedAuthItems as connectedAuthItemTable,
  db,
} from "@/src/db/fmlogs-schema";
import { DeleteAuthItemEndpointArgs } from "@/src/definitions/websocket";
import { and, eq, SQL } from "drizzle-orm";

export async function deleteAuthItem(params: DeleteAuthItemEndpointArgs) {
  const {
    id,
    acknowledgeDeleteAllInApp,
    appId,
    acknowledgeDeleteAllForHashedAuthId,
    hashedAuthId,
  } = params;

  let query: SQL | undefined;

  if (id) {
    query = eq(connectedAuthItemTable.id, id);
  } else if (hashedAuthId && appId && acknowledgeDeleteAllForHashedAuthId) {
    query = and(
      eq(connectedAuthItemTable.hashedAuthId, hashedAuthId),
      eq(connectedAuthItemTable.appId, appId)
    );
  } else if (appId && acknowledgeDeleteAllInApp) {
    query = eq(connectedAuthItemTable.appId, appId);
  }

  if (query) {
    await db.delete(connectedAuthItemTable).where(query);
  }
}
