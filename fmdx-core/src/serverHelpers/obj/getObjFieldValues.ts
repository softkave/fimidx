import { and, count, desc, eq } from "drizzle-orm";
import { db, objParts as objPartsTable } from "../../db/fmdx-schema.js";

export async function getObjFieldValues(params: {
  appId: string;
  field: string;
  page?: number;
  limit?: number;
}) {
  const { appId, field, page = 0, limit = 100 } = params;
  const values = await db
    .select({
      value: objPartsTable.value,
    })
    .from(objPartsTable)
    .where(and(eq(objPartsTable.appId, appId), eq(objPartsTable.field, field)))
    .orderBy(desc(objPartsTable.createdAt))
    .limit(limit)
    .offset(page * limit);

  const total = await db
    .select({
      count: count(),
    })
    .from(objPartsTable)
    .where(and(eq(objPartsTable.appId, appId), eq(objPartsTable.field, field)));

  return {
    values: values.map((value) => value.value),
    total: total[0].count,
    page,
    limit,
  };
}
