import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { db, monitor as monitorTable } from "../../db/fmdx-schema.js";

export async function getMonitor(params: { id?: string }) {
  const { id } = params;

  assert(id, new OwnServerError("Monitor ID is required", 400));

  const [monitor] = await db
    .select()
    .from(monitorTable)
    .where(eq(monitorTable.id, id))
    .limit(1);

  assert(monitor, new OwnServerError("Monitor not found", 404));
  return monitor;
}
