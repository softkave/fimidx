import { eq } from "drizzle-orm";
import { db, orgs as orgsTable } from "../../db/fmdx-schema.js";

export async function deleteOrg(params: { id: string }) {
  const { id } = params;
  await db.delete(orgsTable).where(eq(orgsTable.id, id));
}
