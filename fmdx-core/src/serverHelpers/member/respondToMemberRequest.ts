import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { db, members as membersTable } from "../../db/fmdx-schema.js";
import {
  kMemberStatus,
  type RespondToMemberRequestEndpointArgs,
} from "../../definitions/members.js";
import { getMember } from "./getMember.js";

export async function respondToMemberRequest(params: {
  args: RespondToMemberRequestEndpointArgs;
  userId: string;
}) {
  const { args, userId } = params;
  const { status, requestId } = args;

  const member = await getMember({ id: requestId });

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
    .where(eq(membersTable.id, requestId))
    .returning();

  return updatedMember;
}
