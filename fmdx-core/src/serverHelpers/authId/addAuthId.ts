import { eq } from "drizzle-orm";
import { authIds as authIdTable, db } from "../../db/fmdx-schema.js";
import type { AddAuthIdEndpointArgs } from "../../definitions/webSockets.js";
import { addMultipleAuthItems } from "../authItem/addMultipleAuthItems.js";
import { tryGetAuthId } from "./getAuthId.js";

export async function addAuthId(params: {
  args: AddAuthIdEndpointArgs;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, orgId, clientTokenId } = params;
  const { name, description, authId, appId, authItems } = args;

  const existingAuthId = await tryGetAuthId({
    authId,
    appId,
  });

  if (existingAuthId) {
    const updatedAuthId = await db
      .update(authIdTable)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(authIdTable.id, existingAuthId.id))
      .returning();
    return updatedAuthId[0];
  } else {
    const date = new Date();
    const newAuthId: typeof authIdTable.$inferInsert = {
      name,
      description,
      authId,
      createdAt: date,
      updatedAt: date,
      orgId,
      appId,
      clientTokenId,
    };

    const [returnedAuthId] = await db
      .insert(authIdTable)
      .values(newAuthId)
      .returning();

    if (authItems?.length) {
      await addMultipleAuthItems({
        args: {
          appId,
          authId: returnedAuthId.id,
          authItems,
        },
        orgId,
        clientTokenId,
      });
    }

    return returnedAuthId;
  }
}
