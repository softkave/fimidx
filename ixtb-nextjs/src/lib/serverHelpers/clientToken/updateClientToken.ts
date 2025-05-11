import { clientTokens as clientTokensTable, db } from "@/src/db/fmlogs-schema";
import { UpdateClientTokenEndpointArgs } from "@/src/definitions/clientToken";
import { eq } from "drizzle-orm";
import { checkClientTokenAvailable } from "./checkClientTokenExists";
import { getClientToken } from "./getClientToken";

export async function updateClientToken(params: {
  args: UpdateClientTokenEndpointArgs;
  id: string;
  userId: string;
  orgId: string;
  appId: string;
}) {
  const { args, id, userId, orgId, appId } = params;
  const { name, description } = args;

  const clientToken = await getClientToken({ id, orgId, appId });
  if (name) {
    await checkClientTokenAvailable({ name, orgId, appId, isId: id });
  }

  const [updatedClientToken] = await db
    .update(clientTokensTable)
    .set({
      name: name ?? clientToken.name,
      description: description ?? clientToken.description,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(clientTokensTable.id, id))
    .returning();

  return updatedClientToken;
}
