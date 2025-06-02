import { and, desc, eq } from "drizzle-orm";
import { db, objParts as objPartsTable } from "../../db/fmdx-schema.js";

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
  const [values, hasMore] = await Promise.all([
    getFromDb({ appId, field, page, limit, tag }),
    getFromDb({ appId, field, page: page + 1, limit: 1, tag }),
  ]);

  // const total = await db
  //   .select({
  //     count: count(),
  //   })
  //   .from(objPartsTable)
  //   .where(
  //     and(
  //       eq(objPartsTable.appId, appId),
  //       eq(objPartsTable.field, field),
  //       eq(objPartsTable.tag, tag)
  //     )
  //   );

  return {
    values,
    page,
    limit,
    hasMore: hasMore.length > 0,
  };
}
