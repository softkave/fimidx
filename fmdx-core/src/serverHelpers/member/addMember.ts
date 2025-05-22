import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { db, members as membersTable } from "../../db/fmdx-schema.js";
import type { EmailRecordStatus } from "../../definitions/email.js";
import {
  kMemberStatus,
  type AddMemberEndpointArgs,
  type MemberStatus,
} from "../../definitions/members.js";
import { tryGetUserByEmail } from "../user.js";
import { tryGetMember } from "./getMember.js";

export async function updateMemberSendEmailStatus(params: {
  id: string;
  sentEmailCount: number;
  emailLastSentAt: Date;
  emailLastSentStatus: EmailRecordStatus;
}) {
  const { id, sentEmailCount, emailLastSentAt, emailLastSentStatus } = params;
  await db
    .update(membersTable)
    .set({
      sentEmailCount,
      emailLastSentAt,
      emailLastSentStatus,
    })
    .where(eq(membersTable.id, id));
}

export async function addMember(params: {
  args: AddMemberEndpointArgs;
  inviterId: string;
  orgId: string;
  status?: MemberStatus;
}) {
  const { args, inviterId, orgId, status } = params;
  const { email, permissions } = args;
  const date = new Date();

  const existingMember = await tryGetMember({ email, orgId });
  if (existingMember) {
    throw new OwnServerError("Member already exists", 400);
  }

  const existingUser = await tryGetUserByEmail(email);
  const newMember: typeof membersTable.$inferInsert = {
    email: email.toLowerCase(),
    permissions: permissions,
    status: status ?? kMemberStatus.pending,
    statusUpdatedAt: date,
    sentEmailCount: 0,
    createdAt: date,
    updatedAt: date,
    createdBy: inviterId,
    updatedBy: inviterId,
    orgId,
    userId: existingUser?.id,
  };

  const [member] = await db.insert(membersTable).values(newMember).returning();

  return member;
}
