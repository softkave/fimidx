import { db, monitor as monitorTable } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function checkMonitorExists(params: {
  name: string;
  isId?: string;
  orgId: string;
  appId: string;
}) {
  const monitors = await db
    .select({
      id: monitorTable.id,
      name: monitorTable.name,
    })
    .from(monitorTable)
    .where(
      and(
        eq(monitorTable.nameLower, params.name.toLowerCase()),
        eq(monitorTable.orgId, params.orgId),
        eq(monitorTable.appId, params.appId)
      )
    );

  const monitor = monitors[0];
  const isId = monitor && params.isId === monitor.id;

  return {
    exists: !!monitor,
    isId,
  };
}

export async function checkMonitorAvailable(params: {
  name: string;
  isId?: string;
  orgId: string;
  appId: string;
}) {
  const { exists, isId } = await checkMonitorExists(params);

  if (exists && !isId) {
    throw new OwnServerError("Monitor already exists", 400);
  }

  return {
    exists,
    isId,
  };
}
