import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { db, orgs as orgsTable } from "../../db/fmdx-schema.js";

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
