import { clientTokens as clientTokensTable, db } from "@/src/db/fmlogs-schema";
import { and, eq } from "drizzle-orm";

export async function deleteClientToken(params: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = params;
  await db
    .delete(clientTokensTable)
    .where(
      and(
        eq(clientTokensTable.id, id),
        eq(clientTokensTable.orgId, orgId),
        eq(clientTokensTable.appId, appId)
      )
    );
}
