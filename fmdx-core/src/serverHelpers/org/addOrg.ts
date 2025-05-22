import { db, orgs as orgsTable } from "../../db/fmdx-schema.js";
import type { AddOrgEndpointArgs } from "../../definitions/org.js";

export async function addOrg(params: {
  args: AddOrgEndpointArgs;
  userId: string;
}) {
  const { args, userId } = params;
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

  return org;
}
