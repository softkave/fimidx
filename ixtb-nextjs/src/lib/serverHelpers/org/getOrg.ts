import { db, orgs as orgsTable } from "@/src/db/fmlogs-schema";
import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function getOrg(params: { id: string }) {
  const { id } = params;

  const [org] = await db
    .select()
    .from(orgsTable)
    .where(eq(orgsTable.id, id))
    .limit(1);

  assert(org, new OwnServerError("Organization not found", 404));
  return org;
}
