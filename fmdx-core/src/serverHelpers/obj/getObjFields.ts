import { count, desc, eq } from "drizzle-orm";
import { db, objFields as objFieldsTable } from "../../db/fmdx-schema.js";

export async function getObjFields(params: {
  appId: string;
  page?: number;
  limit?: number;
}) {
  const { appId, page = 0, limit = 100 } = params;
  const fields = await db
    .select()
    .from(objFieldsTable)
    .where(eq(objFieldsTable.appId, appId))
    .orderBy(desc(objFieldsTable.createdAt))
    .limit(limit)
    .offset(page * limit);

  const total = await db
    .select({
      count: count(),
    })
    .from(objFieldsTable)
    .where(eq(objFieldsTable.appId, appId));

  return {
    fields,
    total: total[0].count,
    page,
    limit,
  };
}
