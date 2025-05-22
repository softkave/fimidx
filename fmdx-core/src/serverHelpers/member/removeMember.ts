import { eq } from "drizzle-orm";
import { db, members as membersTable } from "../../db/fmdx-schema.js";

export async function deleteMemberByUserId(params: { userId: string }) {
  const { userId } = params;
  await db.delete(membersTable).where(eq(membersTable.userId, userId));
}

export async function deleteMemberById(params: { id: string }) {
  const { id } = params;
  await db.delete(membersTable).where(eq(membersTable.id, id));
}
