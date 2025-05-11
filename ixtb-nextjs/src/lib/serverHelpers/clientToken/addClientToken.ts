import { clientTokens as clientTokensTable, db } from "@/src/db/fmlogs-schema";
import { AddClientTokenEndpointArgs } from "@/src/definitions/clientToken";
import { checkClientTokenAvailable } from "./checkClientTokenExists";

export async function addClientToken(params: {
  args: AddClientTokenEndpointArgs;
  userId: string;
  appId: string;
  orgId: string;
}) {
  const { args, userId, appId, orgId } = params;
  const { name: inputName, description } = args;
  const date = new Date();
  const name =
    inputName ??
    `token-${date.getTime()}-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
  const newClientToken: typeof clientTokensTable.$inferInsert = {
    appId,
    name,
    nameLower: name.toLowerCase(),
    description: description ?? "",
    createdAt: date,
    updatedAt: date,
    createdBy: userId,
    updatedBy: userId,
    orgId,
  };

  await checkClientTokenAvailable({ name, orgId, appId });

  const clientToken = await db
    .insert(clientTokensTable)
    .values(newClientToken)
    .returning();

  return clientToken[0];
}
