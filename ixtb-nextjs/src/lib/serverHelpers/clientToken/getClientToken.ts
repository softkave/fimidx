import { clientTokens as clientTokensTable, db } from "@/src/db/fmlogs-schema";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function getClientToken(params: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = params;

  const [clientToken] = await db
    .select()
    .from(clientTokensTable)
    .where(
      and(
        eq(clientTokensTable.id, id),
        eq(clientTokensTable.orgId, orgId),
        eq(clientTokensTable.appId, appId)
      )
    )
    .limit(1);

  assert(clientToken, new OwnServerError("Client token not found", 404));
  return clientToken;
}
