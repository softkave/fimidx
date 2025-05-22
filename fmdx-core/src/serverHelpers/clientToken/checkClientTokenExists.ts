import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { clientTokens as clientTokenTable, db } from "../../db/fmdx-schema.js";

export async function checkClientTokenExists(params: {
  name: string;
  isId?: string;
  orgId: string;
  appId: string;
}) {
  const clientTokens = await db
    .select({
      id: clientTokenTable.id,
      name: clientTokenTable.name,
    })
    .from(clientTokenTable)
    .where(
      and(
        eq(clientTokenTable.nameLower, params.name.toLowerCase()),
        eq(clientTokenTable.orgId, params.orgId),
        eq(clientTokenTable.appId, params.appId)
      )
    );

  const clientToken = clientTokens[0];
  const isId = clientToken && params.isId === clientToken.id;

  return {
    exists: !!clientToken,
    isId,
  };
}

export async function checkClientTokenAvailable(params: {
  name: string;
  isId?: string;
  orgId: string;
  appId: string;
}) {
  const { exists, isId } = await checkClientTokenExists(params);

  if (exists && !isId) {
    throw new OwnServerError("Client token already exists", 400);
  }

  return {
    exists,
    isId,
  };
}
