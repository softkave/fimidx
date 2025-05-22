import { indexArray } from "softkave-js-utils";
import {
  connectedAuthItems as connectedAuthItemTable,
  db,
} from "../../db/fmdx-schema.js";
import type {
  AddMultipleAuthItemsEndpointArgs,
  IConnectedAuthItem,
} from "../../definitions/webSockets.js";
import { getAuthItemList } from "./getAuthItems.js";

const indexKeys: Record<keyof IConnectedAuthItem, boolean> = {
  messageRoomId: true,
  messageSocketId: true,
  messageServer: true,
  messageRoomSocket: true,
  messageAuthId: true,
  id: false,
  createdAt: false,
  updatedAt: false,
  orgId: false,
  appId: false,
  clientTokenId: false,
  authId: false,
};

function getIndexKey(item: Partial<IConnectedAuthItem>) {
  return Object.entries(item)
    .filter(([key]) => indexKeys[key as keyof IConnectedAuthItem])
    .map(([, value]) => value)
    .join("-");
}

export async function addMultipleAuthItems(params: {
  args: AddMultipleAuthItemsEndpointArgs;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, orgId, clientTokenId } = params;
  const { authId, authItems, appId } = args;

  const { authItems: existingAuthItems } = await getAuthItemList({
    appId,
    authId,
  });

  const index = indexArray(existingAuthItems, {
    indexer: (item) => getIndexKey(item),
  });

  const newAuthItems = authItems
    .filter((item) => {
      const key = getIndexKey(item);
      return !index[key];
    })
    .map((item) => {
      const date = new Date();
      const newAuthItem: typeof connectedAuthItemTable.$inferInsert = {
        appId,
        authId,
        createdAt: date,
        updatedAt: date,
        orgId,
        clientTokenId,
        messageRoomId: item.messageRoomId ?? null,
        messageSocketId: item.messageSocketId ?? null,
        messageServer: item.messageServer ?? null,
        messageRoomSocket: item.messageRoomSocket ?? null,
        messageAuthId: item.messageAuthId ?? null,
      };

      return newAuthItem;
    });

  if (newAuthItems.length > 0) {
    const returnedAuthItems = await db
      .insert(connectedAuthItemTable)
      .values(newAuthItems)
      .returning();

    return returnedAuthItems;
  }

  return [] as IConnectedAuthItem[];
}
