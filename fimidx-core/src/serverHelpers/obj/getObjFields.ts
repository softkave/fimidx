import { and, desc, eq } from "drizzle-orm";
import { db, objFields as objFieldsTable } from "../../db/fimidx.sqlite.js";
import type {
  IGetObjFieldsEndpointResponse,
  IObjField,
} from "../../definitions/obj.js";

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
}): Promise<IGetObjFieldsEndpointResponse> {
  const { appId, page = 0, limit = 100, tag } = params;
  const fields = await getFromDb({ appId, page, limit, tag });
  let hasMore = false;
  if (fields.length === limit) {
    const nextPage = await getFromDb({ appId, page: page + 1, limit: 1, tag });
    hasMore = nextPage.length > 0;
  }
  return {
    fields: fields as IObjField[],
    page,
    limit,
    hasMore,
  };
}
