import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { and, eq, inArray } from "drizzle-orm";

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
