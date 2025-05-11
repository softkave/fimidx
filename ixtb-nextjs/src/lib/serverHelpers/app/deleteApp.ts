import { apps as appsTable, db } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";

export async function deleteApp(params: { id: string; orgId: string }) {
  const { id, orgId } = params;
  await db
    .delete(appsTable)
    .where(and(eq(appsTable.id, id), eq(appsTable.orgId, orgId)));
}
