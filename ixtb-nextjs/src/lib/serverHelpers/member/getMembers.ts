import { db, members as membersTable } from "@/src/db/fmlogs-schema";
import { GetMembersEndpointArgs } from "@/src/definitions/members";
import { count, eq } from "drizzle-orm";

async function getOrgMembersFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  orgId: string;
}) {
  const { limitNumber, pageNumber, orgId } = params;
  const members = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.orgId, orgId))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return members;
}

async function countOrgMembersInDB(params: { orgId: string }) {
  const { orgId } = params;
  const tokenCount = await db
    .select({ count: count() })
    .from(membersTable)
    .where(eq(membersTable.orgId, orgId));

  return tokenCount[0].count;
}

export async function getOrgMemberList(params: {
  args: GetMembersEndpointArgs;
  orgId: string;
}) {
  const { args, orgId } = params;
  const { page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [members, total] = await Promise.all([
    getOrgMembersFromDB({ limitNumber, pageNumber, orgId }),
    countOrgMembersInDB({ orgId }),
  ]);

  return {
    members,
    total,
  };
}
