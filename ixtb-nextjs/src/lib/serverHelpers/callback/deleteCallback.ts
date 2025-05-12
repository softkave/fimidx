import { callbacks as callbackTable, db } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";

export async function deleteCallback(params: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = params;
  await db
    .delete(callbackTable)
    .where(
      and(
        eq(callbackTable.id, id),
        eq(callbackTable.orgId, orgId),
        eq(callbackTable.appId, appId)
      )
    );
}
