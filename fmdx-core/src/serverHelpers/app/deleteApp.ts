import { eq } from "drizzle-orm";
import { apps as appsTable, db } from "../../db/fmdx-schema.js";

export async function deleteApp(params: { id: string }) {
  const { id } = params;
  await db.delete(appsTable).where(eq(appsTable.id, id));
}
