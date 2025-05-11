import { db, orgs as orgsTable } from "@/src/db/fmlogs-schema";
import { eq } from "drizzle-orm";

export async function deleteOrg(params: { id: string }) {
  const { id } = params;
  await db.delete(orgsTable).where(eq(orgsTable.id, id));
}
