import { db, messages as messagesTable } from "../../db/fmdx-schema.js";

export interface IAddMessageArgs {
  orgId: string;
  appId: string;
  message: string;
  fromSocketId: string | null;
  toSocketId: string | null;
  toRoomId: string | null;
  toServer?: boolean | null;
  fromServer?: boolean | null;
  toAuthId?: string | null;
  fromAuthId?: string | null;
}

export async function addMessage(params: IAddMessageArgs) {
  const {
    orgId,
    appId,
    message,
    fromSocketId,
    toSocketId,
    toAuthId,
    toRoomId,
    toServer,
    fromServer,
    fromAuthId,
  } = params;
  const date = new Date();
  const newMessage: typeof messagesTable.$inferInsert = {
    appId,
    createdAt: date,
    fromSocketId,
    message,
    orgId,
    toSocketId,
    updatedAt: date,
    toRoomId,
    toServer,
    fromServer,
    toAuthId,
    fromAuthId,
  };

  const [messageToReturn] = await db
    .insert(messagesTable)
    .values(newMessage)
    .returning();

  return messageToReturn;
}
