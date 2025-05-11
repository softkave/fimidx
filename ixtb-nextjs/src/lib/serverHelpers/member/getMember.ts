import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { IMember } from "@/src/definitions/members";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

async function getMemberById(params: { id: string; orgId: string }) {
  const { id, orgId } = params;

  const [member] = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.id, id), eq(membersTable.orgId, orgId)))
    .limit(1);

  return member;
}

async function getMemberByEmail(params: { email: string; orgId: string }) {
  const { email, orgId } = params;

  const [member] = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.email, email), eq(membersTable.orgId, orgId)))
    .limit(1);

  return member;
}

async function getMemberByUserId(params: { userId: string; orgId: string }) {
  const { userId, orgId } = params;

  const [member] = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.userId, userId), eq(membersTable.orgId, orgId)))
    .limit(1);

  return member;
}

export async function tryGetMember(params: {
  id?: string;
  email?: string;
  userId?: string;
  orgId: string;
}) {
  const { id, email, userId, orgId } = params;
  let member: IMember | null = null;

  if (id) {
    member = await getMemberById({ id, orgId });
  }

  if (email) {
    member = await getMemberByEmail({ email, orgId });
  }

  if (userId) {
    member = await getMemberByUserId({ userId, orgId });
  }

  return member;
}

export async function getMember(params: {
  id?: string;
  email?: string;
  userId?: string;
  orgId: string;
}) {
  const member = await tryGetMember(params);

  if (!member) {
    throw new OwnServerError("Invalid request", 400);
  }

  return member;
}
