import { db, logFields as logFieldsTable } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";

export async function getLogFields(params: { appId: string; orgId: string }) {
  const { appId, orgId } = params;
  const fields = await db
    .select()
    .from(logFieldsTable)
    .where(
      and(eq(logFieldsTable.appId, appId), eq(logFieldsTable.orgId, orgId))
    );

  return fields;
}
