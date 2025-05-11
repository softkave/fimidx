import { db, monitor as monitorTable } from "@/src/db/fmlogs-schema";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function getMonitor(params: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = params;

  const [monitor] = await db
    .select()
    .from(monitorTable)
    .where(
      and(
        eq(monitorTable.id, id),
        eq(monitorTable.orgId, orgId),
        eq(monitorTable.appId, appId)
      )
    )
    .limit(1);

  assert(monitor, new OwnServerError("Monitor not found", 404));
  return monitor;
}
