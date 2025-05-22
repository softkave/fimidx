import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { clientTokens as clientTokensTable, db } from "../../db/fmdx-schema.js";

export async function getClientToken(params: { id: string }) {
  const { id } = params;

  const [clientToken] = await db
    .select()
    .from(clientTokensTable)
    .where(eq(clientTokensTable.id, id))
    .limit(1);

  assert(clientToken, new OwnServerError("Client token not found", 404));
  return clientToken;
}
