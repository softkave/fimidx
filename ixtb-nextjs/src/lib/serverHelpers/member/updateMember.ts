import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { UpdateMemberEndpointArgs } from "@/src/definitions/members";
import { and, eq } from "drizzle-orm";
import { getMember } from "./getMember";

export async function updateMemberByUserId(params: {
  args: UpdateMemberEndpointArgs;
  userId: string;
  updatedBy: string;
  orgId: string;
}) {
  const { args, userId, updatedBy, orgId } = params;
  const { permissions } = args;

  const member = await getMember({ userId, orgId });
  const [updatedMember] = await db
    .update(membersTable)
    .set({
      permissions: permissions ?? member.permissions ?? [],
      updatedAt: new Date(),
      updatedBy,
    })
    .where(and(eq(membersTable.userId, userId), eq(membersTable.orgId, orgId)))
    .returning();

  return updatedMember;
}

export async function updateMemberById(params: {
  args: UpdateMemberEndpointArgs;
  id: string;
  updatedBy: string;
  orgId: string;
}) {
  const { args, id, updatedBy, orgId } = params;
  const { permissions } = args;

  const member = await getMember({ id, orgId });
  const [updatedMember] = await db
    .update(membersTable)
    .set({
      permissions: permissions ?? member.permissions ?? [],
      updatedAt: new Date(),
      updatedBy,
    })
    .where(and(eq(membersTable.id, id), eq(membersTable.orgId, orgId)))
    .returning();

  return updatedMember;
}
