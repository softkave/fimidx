import { db, orgs as orgsTable } from "@/src/db/fmlogs-schema";
import { kMemberStatus } from "@/src/definitions/members";
import { AddOrgEndpointArgs } from "@/src/definitions/org";
import { kPermissions } from "@/src/definitions/permissions";
import { addMember } from "../member/addMember";

export async function addOrg(params: {
  args: AddOrgEndpointArgs;
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const { args, userId, userEmail, userName } = params;
  const { name, description } = args;
  const date = new Date();
  const newOrg: typeof orgsTable.$inferInsert = {
    name: name,
    nameLower: name.toLowerCase(),
    description: description ?? "",
    createdAt: date,
    updatedAt: date,
    createdBy: userId,
    updatedBy: userId,
  };

  const [org] = await db.insert(orgsTable).values(newOrg).returning();

  await addMember({
    args: {
      email: userEmail,
      permissions: [kPermissions.wildcard],
    },
    inviterId: userId,
    orgId: org.id,
    inviterName: userName,
    skipEmail: true,
    status: kMemberStatus.accepted,
  });

  return org;
}
