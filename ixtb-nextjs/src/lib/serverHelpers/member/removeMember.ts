import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";

export async function deleteMemberByUserId(params: {
  userId: string;
  orgId: string;
}) {
  const { userId, orgId } = params;
  await db
    .delete(membersTable)
    .where(and(eq(membersTable.userId, userId), eq(membersTable.orgId, orgId)));
}

export async function deleteMemberById(params: { id: string; orgId: string }) {
  const { id, orgId } = params;
  await db
    .delete(membersTable)
    .where(and(eq(membersTable.id, id), eq(membersTable.orgId, orgId)));
}
