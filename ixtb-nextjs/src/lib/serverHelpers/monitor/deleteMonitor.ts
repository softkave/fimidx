import { db, monitor as monitorTable } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";

export async function deleteMonitor(params: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = params;
  await db
    .delete(monitorTable)
    .where(
      and(
        eq(monitorTable.id, id),
        eq(monitorTable.orgId, orgId),
        eq(monitorTable.appId, appId)
      )
    );
}
