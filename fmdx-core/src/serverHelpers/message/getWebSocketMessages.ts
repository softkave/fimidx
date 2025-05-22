import { SQL, and, count, desc, eq } from "drizzle-orm";
import { db, messages as messagesTable } from "../../db/fmdx-schema.js";
import type { GetWebSocketMessagesEndpointArgs } from "../../definitions/message.js";

function makeQuery(params: GetWebSocketMessagesEndpointArgs) {
  const {
    appId,
    fromSocketId,
    fromAuthId,
    toRoomId,
    toSocketId,
    toAuthId,
    toServer,
  } = params;

  const andClauses: SQL[] = [];

  if (appId) {
    andClauses.push(eq(messagesTable.appId, appId));
  }

  if (toRoomId) {
    andClauses.push(eq(messagesTable.toRoomId, toRoomId));
  }

  if (fromSocketId) {
    andClauses.push(eq(messagesTable.fromSocketId, fromSocketId));
  }

  if (toSocketId) {
    // TODO: get the hashed auth IDs the socket's been associated with and use
    // them in the query
    andClauses.push(eq(messagesTable.toSocketId, toSocketId));
  }

  if (toAuthId) {
    andClauses.push(eq(messagesTable.toAuthId, toAuthId));
  }

  if (toServer !== undefined) {
    andClauses.push(eq(messagesTable.toServer, toServer));
  }

  if (andClauses.length) {
    return and(...andClauses);
  }

  return undefined;
}

async function getFromDBWithQuery(params: {
  query: SQL;
  limit: number;
  page: number;
}) {
  const { query, limit, page } = params;

  const limitNumber = limit ?? 10;
  const pageNumber = page ?? 1;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(query)
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber)
    .orderBy(desc(messagesTable.createdAt));

  return messages;
}

async function countInDBWithQuery(params: { query: SQL }) {
  const { query } = params;

  const messageCount = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(query);

  return messageCount[0].count;
}

export async function getWebSocketMessages(
  params: GetWebSocketMessagesEndpointArgs
) {
  const { limit, page } = params;
  const query = makeQuery(params);

  if (!query) {
    return { messages: [], total: 0 };
  }

  const limitNumber = limit ?? 10;
  const pageNumber = page ?? 1;

  const [messages, total] = await Promise.all([
    getFromDBWithQuery({ query, limit: limitNumber, page: pageNumber }),
    countInDBWithQuery({ query }),
  ]);

  return { messages, total };
}
