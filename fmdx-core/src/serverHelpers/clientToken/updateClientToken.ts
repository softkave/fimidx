import { eq } from "drizzle-orm";
import { clientTokens as clientTokensTable, db } from "../../db/fmdx-schema.js";
import type {
  IClientToken,
  UpdateClientTokenEndpointArgs,
} from "../../definitions/clientToken.js";
import { checkClientTokenAvailable } from "./checkClientTokenExists.js";
import { getClientToken } from "./getClientToken.js";

export async function updateClientToken(params: {
  args: UpdateClientTokenEndpointArgs;
  id: string;
  userId: string;
  existingClientToken?: IClientToken;
}) {
  const { args, id, userId, existingClientToken } = params;
  const { name, description } = args;

  const clientToken = existingClientToken ?? (await getClientToken({ id }));
  if (name) {
    await checkClientTokenAvailable({
      name,
      orgId: clientToken.orgId,
      appId: clientToken.appId,
      isId: id,
    });
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
