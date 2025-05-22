import { and, eq } from "drizzle-orm";
import { db, members as membersTable } from "../../db/fmdx-schema.js";
import type {
  IMember,
  UpdateMemberEndpointArgs,
} from "../../definitions/members.js";
import { getMember } from "./getMember.js";

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
  updatedBy: string;
  existingMember?: IMember;
}) {
  const { args, updatedBy, existingMember } = params;
  const { permissions } = args;

  const member = existingMember ?? (await getMember({ id: args.id }));
  const [updatedMember] = await db
    .update(membersTable)
    .set({
      permissions: permissions ?? member.permissions ?? [],
      updatedAt: new Date(),
      updatedBy,
    })
    .where(eq(membersTable.id, member.id))
    .returning();

  return updatedMember;
}
