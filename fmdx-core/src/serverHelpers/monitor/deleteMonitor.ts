import { eq } from "drizzle-orm";
import { db, monitor as monitorTable } from "../../db/fmdx-schema.js";

export async function deleteMonitor(params: { id: string }) {
  const { id } = params;
  await db.delete(monitorTable).where(eq(monitorTable.id, id));
}
