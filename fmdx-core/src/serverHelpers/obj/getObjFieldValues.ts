import { and, desc, eq } from "drizzle-orm";
import { db, objParts as objPartsTable } from "../../db/fmdx.sqlite.js";

async function getFromDb(params: {
  appId: string;
  field: string;
  page: number;
  limit: number;
  tag: string;
}) {
  const { appId, field, page, limit, tag } = params;
  return await db
    .select({
      value: objPartsTable.value,
      type: objPartsTable.type,
    })
    .from(objPartsTable)
    .where(
      and(
        eq(objPartsTable.appId, appId),
        eq(objPartsTable.field, field),
        eq(objPartsTable.tag, tag)
      )
    )
    .orderBy(desc(objPartsTable.createdAt))
    .limit(limit)
    .offset(page * limit);
}

export async function getObjFieldValues(params: {
  appId: string;
  field: string;
  page?: number;
  limit?: number;
  tag: string;
}) {
  const { appId, field, page = 0, limit = 100, tag } = params;
  // Fetch limit+1 items to check for hasMore
  const results = await getFromDb({
    appId,
    field,
    page,
    limit: limit + 1,
    tag,
  });

  const hasMore = results.length > limit;
  const values = hasMore ? results.slice(0, limit) : results;
  return {
    values,
    page,
    limit,
    hasMore,
  };
}
