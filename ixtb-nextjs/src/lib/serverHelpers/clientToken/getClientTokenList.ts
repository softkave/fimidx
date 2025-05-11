import { clientTokens as clientTokensTable, db } from "@/src/db/fmlogs-schema";
import { GetClientTokensEndpointArgs } from "@/src/definitions/clientToken";
import { and, count, eq } from "drizzle-orm";

async function getClientTokensFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
  orgId: string;
}) {
  const { limitNumber, pageNumber, appId, orgId } = params;
  const clientTokens = await db
    .select()
    .from(clientTokensTable)
    .where(
      and(
        eq(clientTokensTable.appId, appId),
        eq(clientTokensTable.orgId, orgId)
      )
    )
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return clientTokens;
}

async function countClientTokensInDB(params: { appId: string; orgId: string }) {
  const { appId, orgId } = params;
  const tokenCount = await db
    .select({ count: count() })
    .from(clientTokensTable)
    .where(
      and(
        eq(clientTokensTable.appId, appId),
        eq(clientTokensTable.orgId, orgId)
      )
    );

  return tokenCount[0].count;
}

export async function getClientTokenList(params: {
  args: GetClientTokensEndpointArgs;
  appId: string;
  orgId: string;
}) {
  const { args, appId, orgId } = params;
  const { page, limit } = args;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [clientTokens, total] = await Promise.all([
    getClientTokensFromDB({ limitNumber, pageNumber, appId, orgId }),
    countClientTokensInDB({ appId, orgId }),
  ]);

  return {
    clientTokens,
    total,
  };
}
