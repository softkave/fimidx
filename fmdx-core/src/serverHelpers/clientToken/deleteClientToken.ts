import { eq } from "drizzle-orm";
import { clientTokens as clientTokensTable, db } from "../../db/fmdx-schema.js";

export async function deleteClientToken(params: { id: string }) {
  const { id } = params;
  await db.delete(clientTokensTable).where(eq(clientTokensTable.id, id));
}
