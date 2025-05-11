import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import {
  kMemberStatus,
  RespondToMemberRequestEndpointArgs,
} from "@/src/definitions/members";
import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";
import { getMember } from "./getMember";

export async function respondToMemberRequest(params: {
  args: RespondToMemberRequestEndpointArgs;
  id: string;
  userId: string;
  orgId: string;
}) {
  const { args, id, userId, orgId } = params;
  const { status } = args;

  const member = await getMember({ id, orgId });

  assert(
    member.status === kMemberStatus.pending,
    new OwnServerError("Invalid status", 400)
  );
  assert(member.userId === userId, new OwnServerError("Access Denied", 403));

  const [updatedMember] = await db
    .update(membersTable)
    .set({
      status,
      statusUpdatedAt: new Date(),
      userId: userId ?? member.userId,
    })
    .where(eq(membersTable.id, id))
    .returning();

  return updatedMember;
}
