import { and, eq, inArray } from "drizzle-orm";
import { db, members as membersTable } from "../../db/fmdx-schema.js";

export async function hasMembers(params: { orgId: string; userIds: string[] }) {
  const { orgId, userIds } = params;
  const members = await db
    .select({
      id: membersTable.id,
    })
    .from(membersTable)
    .where(
      and(inArray(membersTable.userId, userIds), eq(membersTable.orgId, orgId))
    );

  return members.length === userIds.length;
}
