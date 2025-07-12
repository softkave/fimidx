import { and, eq } from "drizzle-orm";
import { db, objArrayFields } from "../../db/fmdx.sqlite.js";
import type { IObjArrayField } from "../../definitions/obj.js";

export async function getObjArrayFields(params: {
  appId: string;
  tag?: string;
  groupId?: string;
  page?: number;
  limit?: number;
}): Promise<IObjArrayField[]> {
  const { appId, tag, groupId, page = 0, limit = 100 } = params;

  const conditions = [eq(objArrayFields.appId, appId)];

  if (tag) {
    conditions.push(eq(objArrayFields.tag, tag));
  }

  if (groupId) {
    conditions.push(eq(objArrayFields.groupId, groupId));
  }

  const results = await db
    .select()
    .from(objArrayFields)
    .where(and(...conditions))
    .limit(limit)
    .offset(page * limit);

  return results.map((row) => ({
    id: row.id,
    field: row.field,
    appId: row.appId,
    groupId: row.groupId,
    tag: row.tag,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}
