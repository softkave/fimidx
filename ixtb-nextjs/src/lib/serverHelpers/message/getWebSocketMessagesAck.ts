import { db, messageAcks as messageAcksTable } from "@/src/db/fmlogs-schema";
import { GetWebSocketMessagesAckEndpointArgs } from "@/src/definitions/message";
import { SQL, and, count, desc, eq } from "drizzle-orm";

function makeQuery(params: GetWebSocketMessagesAckEndpointArgs) {
  const { messageId, socketId } = params;

  const andClauses: SQL[] = [];

  if (socketId) {
    // TODO: get the hashed auth IDs the socket's been associated with and use
    // them in the query
    andClauses.push(eq(messageAcksTable.socketId, socketId));
  }

  if (messageId) {
    andClauses.push(eq(messageAcksTable.messageId, messageId));
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

  const messageAcks = await db
    .select()
    .from(messageAcksTable)
    .where(query)
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber)
    .orderBy(desc(messageAcksTable.ackedAt));

  return messageAcks;
}

async function countInDBWithQuery(params: { query: SQL }) {
  const { query } = params;

  const messageAckCount = await db
    .select({ count: count() })
    .from(messageAcksTable)
    .where(query);

  return messageAckCount[0].count;
}

export async function getWebSocketMessagesAck(
  params: GetWebSocketMessagesAckEndpointArgs
) {
  const { limit, page } = params;
  const query = makeQuery(params);

  if (!query) {
    return { messageAcks: [], total: 0 };
  }

  const limitNumber = limit ?? 10;
  const pageNumber = page ?? 1;

  const [messageAcks, total] = await Promise.all([
    getFromDBWithQuery({ query, limit: limitNumber, page: pageNumber }),
    countInDBWithQuery({ query }),
  ]);

  return { messageAcks, total };
}
