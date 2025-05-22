import { eq } from "drizzle-orm";
import { db, messages as messagesTable } from "../../db/fmdx-schema.js";
import type { IWebSocketMessage } from "../../definitions/message.js";

export async function getMessageById(params: {
  messageId: string;
}): Promise<IWebSocketMessage | null> {
  const { messageId } = params;

  const [message] = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.id, messageId));

  return message;
}
