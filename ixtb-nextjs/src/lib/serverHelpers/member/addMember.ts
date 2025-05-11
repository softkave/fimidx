import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { kEmailRecordStatus } from "@/src/definitions/email";
import {
  AddMemberEndpointArgs,
  kMemberStatus,
  MemberStatus,
} from "@/src/definitions/members";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";
import { sendAddParticipantEmail } from "../emails/sendAddParticipantEmail";
import { getOrg } from "../org/getOrg";
import { tryGetUserByEmail } from "../user";
import { tryGetMember } from "./getMember";

async function sendEmailAndUpdateMember(params: {
  to: string;
  orgName: string;
  inviterName: string;
  callerId: string;
}) {
  const { to, orgName, inviterName, callerId } = params;
  try {
    await sendAddParticipantEmail({
      to,
      orgName,
      inviterName,
      callerId,
    });

    await db
      .update(membersTable)
      .set({
        sentEmailCount: 1,
        emailLastSentAt: new Date(),
        emailLastSentStatus: kEmailRecordStatus.sent,
      })
      .where(eq(membersTable.id, callerId));
  } catch (error) {
    console.error(error);
  }
}

export async function addMember(params: {
  args: AddMemberEndpointArgs;
  inviterId: string;
  orgId: string;
  inviterName: string;
  skipEmail?: boolean;
  status?: MemberStatus;
}) {
  const {
    args,
    inviterId,
    orgId,
    inviterName,
    skipEmail = false,
    status,
  } = params;
  const { email, permissions } = args;
  const date = new Date();

  const existingMember = await tryGetMember({ email, orgId });
  if (existingMember) {
    throw new OwnServerError("Member already exists", 400);
  }

  const [existingUser, org] = await Promise.all([
    tryGetUserByEmail(email),
    getOrg({ id: orgId }),
  ]);

  const newMember: typeof membersTable.$inferInsert = {
    email,
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

  if (!skipEmail) {
    // TODO: we should not do this here, but in a queue
    // fire and forget
    sendEmailAndUpdateMember({
      to: email,
      orgName: org.name,
      inviterName,
      callerId: member.id,
    });
  }

  return member;
}
