import { and, eq } from "drizzle-orm";
import { db, logFields as logFieldsTable } from "../../db/fmdx-schema.js";

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
