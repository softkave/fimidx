import { db, hashedAuthIds as hashedAuthIdTable } from "@/src/db/fmlogs-schema";
import { AddHashedAuthIdEndpointArgs } from "@/src/definitions/websocket";
import { eq } from "drizzle-orm";
import { tryGetHashedAuthId } from "./getHashedAuthId";

export async function addHashedAuthId(params: {
  args: AddHashedAuthIdEndpointArgs;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, orgId, clientTokenId } = params;
  const { name, description, hashedAuthId, appId, usage } = args;

  const existingHashedAuthId = await tryGetHashedAuthId({
    hashedAuthId,
    appId,
  });

  if (existingHashedAuthId) {
    const updatedHashedAuthId = await db
      .update(hashedAuthIdTable)
      .set({
        description,
        updatedAt: new Date(),
        usage,
      })
      .where(eq(hashedAuthIdTable.id, existingHashedAuthId.id))
      .returning();
    return updatedHashedAuthId[0];
  } else {
    const date = new Date();
    const newHashedAuthId: typeof hashedAuthIdTable.$inferInsert = {
      name,
      description,
      hashedAuthId,
      createdAt: date,
      updatedAt: date,
      orgId,
      appId,
      clientTokenId,
      usage,
    };

    const [returnedHashedAuthId] = await db
      .insert(hashedAuthIdTable)
      .values(newHashedAuthId)
      .returning();
    return returnedHashedAuthId;
  }
}
