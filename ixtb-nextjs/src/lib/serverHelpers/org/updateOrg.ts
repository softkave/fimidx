import { db, orgs as orgsTable } from "@/src/db/fmlogs-schema";
import { UpdateOrgEndpointArgs } from "@/src/definitions/org";
import { eq } from "drizzle-orm";
import { getOrg } from "./getOrg";

export async function updateOrg(params: {
  args: UpdateOrgEndpointArgs;
  id: string;
  userId: string;
}) {
  const { args, id, userId } = params;
  const { name, description } = args;

  const org = await getOrg({ id });
  const [updatedOrg] = await db
    .update(orgsTable)
    .set({
      name: name ?? org.name,
      description: description ?? org.description,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(orgsTable.id, id))
    .returning();

  return updatedOrg;
}
