import { and, desc, eq } from "drizzle-orm";
import { db, objFields as objFieldsTable } from "../../db/fmdx-schema.js";

async function getFromDb(params: {
  appId: string;
  page: number;
  limit: number;
  tag: string;
}) {
  const { appId, page, limit, tag } = params;
  return await db
    .select()
    .from(objFieldsTable)
    .where(and(eq(objFieldsTable.appId, appId), eq(objFieldsTable.tag, tag)))
    .orderBy(desc(objFieldsTable.createdAt))
    .limit(limit)
    .offset(page * limit);
}

export async function getObjFields(params: {
  appId: string;
  page?: number;
  limit?: number;
  tag: string;
}) {
  const { appId, page = 0, limit = 100, tag } = params;
  const [fields, hasMore] = await Promise.all([
    getFromDb({ appId, page, limit, tag }),
    getFromDb({ appId, page: page + 1, limit: 1, tag }),
  ]);

  // const total = await db
  //   .select({
  //     count: count(),
  //   })
  //   .from(objFieldsTable)
  //   .where(and(eq(objFieldsTable.appId, appId), eq(objFieldsTable.tag, tag)));

  return {
    fields,
    page,
    limit,
    hasMore: hasMore.length > 0,
  };
}
