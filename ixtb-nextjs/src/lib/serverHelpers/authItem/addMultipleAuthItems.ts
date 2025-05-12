import {
  connectedAuthItems as connectedAuthItemTable,
  db,
} from "@/src/db/fmlogs-schema";
import { AddMultipleAuthItemsEndpointArgs } from "@/src/definitions/websocket";
import { indexArray } from "softkave-js-utils";
import { getAuthItemList } from "./getAuthItems";

export async function addMultipleAuthItems(params: {
  args: AddMultipleAuthItemsEndpointArgs;
  appId: string;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, appId, orgId, clientTokenId } = params;
  const { hashedAuthId, authItems } = args;

  const { authItems: existingAuthItems } = await getAuthItemList({
    appId,
    hashedAuthId,
  });

  const index = indexArray(existingAuthItems, {
    indexer: (item) => `${item.hashedAuthId}-${item.roomId}-${item.accessType}`,
  });

  const newAuthItems = authItems
    .filter((item) => {
      const key = `${hashedAuthId}-${item.roomId}-${item.accessType}`;
      return !index[key];
    })
    .map((item) => {
      const date = new Date();
      const newAuthItem: typeof connectedAuthItemTable.$inferInsert = {
        appId,
        hashedAuthId,
        roomId: item.roomId ?? null,
        accessType: item.accessType,
        createdAt: date,
        updatedAt: date,
        orgId,
        clientTokenId,
      };

      return newAuthItem;
    });

  if (newAuthItems.length > 0) {
    const [returnedAuthItems] = await db
      .insert(connectedAuthItemTable)
      .values(newAuthItems)
      .returning();

    return returnedAuthItems;
  }

  return [];
}
