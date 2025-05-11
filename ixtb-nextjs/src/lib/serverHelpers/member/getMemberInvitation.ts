import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { IMember, kMemberStatus } from "@/src/definitions/members";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function getMemberInvitation(params: {
  userId: string;
  orgId: string;
}) {
  const { userId, orgId } = params;

  const invitation = await db
    .select()
    .from(membersTable)
    .where(
      and(
        eq(membersTable.userId, userId),
        eq(membersTable.orgId, orgId),
        eq(membersTable.status, kMemberStatus.accepted)
      )
    );

  return invitation[0] as IMember | undefined;
}

export async function hasMemberInvitation(params: {
  userId: string;
  orgId: string;
}) {
  const { userId, orgId } = params;
  const invitation = await getMemberInvitation({ userId, orgId });
  assert(invitation, new OwnServerError("Access Denied", 403));
}
