import {
  db,
  members as membersTable,
  orgs as orgsTable,
} from "@/src/db/fmlogs-schema";
import { kMemberStatus } from "@/src/definitions/members";
import { GetOrgsEndpointArgs } from "@/src/definitions/org";
import { and, count, desc, eq, inArray } from "drizzle-orm";

async function getOrgsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  orgIds: string[];
}) {
  const { limitNumber, pageNumber, orgIds } = params;

  const orgs = await db
    .select()
    .from(orgsTable)
    .where(inArray(orgsTable.id, orgIds))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return orgs;
}

async function getUserInvitedOrgs(params: {
  userId: string;
  limitNumber: number;
  pageNumber: number;
}) {
  const { userId, limitNumber, pageNumber } = params;

  const inviations = await db
    .select({
      orgId: membersTable.orgId,
    })
    .from(membersTable)
    .where(
      and(
        eq(membersTable.userId, userId),
        eq(membersTable.status, kMemberStatus.accepted)
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber)
    .orderBy(desc(membersTable.createdAt));

  const orgIds = inviations.map((invitation) => invitation.orgId);
  return orgIds;
}

async function countUserInvitedOrgs(params: { userId: string }) {
  const { userId } = params;

  const inviations = await db
    .select({
      count: count(),
    })
    .from(membersTable)
    .where(
      and(
        eq(membersTable.userId, userId),
        eq(membersTable.status, kMemberStatus.accepted)
      )
    );

  return inviations[0].count;
}

export async function getOrgList(params: {
  args: GetOrgsEndpointArgs;
  userId: string;
}) {
  const { args, userId } = params;
  const { page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [orgIds, total] = await Promise.all([
    getUserInvitedOrgs({ limitNumber, pageNumber, userId }),
    countUserInvitedOrgs({ userId }),
  ]);

  const orgs = await getOrgsFromDB({ limitNumber, pageNumber, orgIds });
  return {
    orgs,
    total,
  };
}
