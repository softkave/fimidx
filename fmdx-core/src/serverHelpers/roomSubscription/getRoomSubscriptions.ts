import { SQL, and, count, desc, eq } from "drizzle-orm";
import {
  db,
  roomSubscriptions as roomSubscriptionsTable,
} from "../../db/fmdx-schema.js";
import type { GetRoomSubscriptionsEndpointArgs } from "../../definitions/room.js";
import { tryGetRoom } from "../room/getRoom.js";

async function makeQuery(params: GetRoomSubscriptionsEndpointArgs) {
  const { authId, roomId, roomName, appId, socketId } = params;

  const andClauses: SQL[] = [];

  if (authId) {
    andClauses.push(eq(roomSubscriptionsTable.authId, authId));
  }

  if (roomId) {
    andClauses.push(eq(roomSubscriptionsTable.roomId, roomId));
  }

  if (socketId) {
    // TODO: get the hashed auth IDs the socket's been associated with and use
    // them in the query
    andClauses.push(eq(roomSubscriptionsTable.socketId, socketId));
  }

  if (roomName && appId) {
    const room = await tryGetRoom({ name: roomName, appId });
    if (room) {
      andClauses.push(eq(roomSubscriptionsTable.roomId, room.id));
    }
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

  const roomSubscriptions = await db
    .select()
    .from(roomSubscriptionsTable)
    .where(query)
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber)
    .orderBy(desc(roomSubscriptionsTable.createdAt));

  return roomSubscriptions;
}

async function countInDBWithQuery(params: { query: SQL }) {
  const { query } = params;

  const roomSubscriptionCount = await db
    .select({ count: count() })
    .from(roomSubscriptionsTable)
    .where(query);

  return roomSubscriptionCount[0].count;
}

export async function getRoomSubscriptions(
  params: GetRoomSubscriptionsEndpointArgs
) {
  const { limit, page } = params;
  const query = await makeQuery(params);

  if (!query) {
    return { roomSubscriptions: [], total: 0 };
  }

  const limitNumber = limit ?? 10;
  const pageNumber = page ?? 1;

  const [roomSubscriptions, total] = await Promise.all([
    getFromDBWithQuery({ query, limit: limitNumber, page: pageNumber }),
    countInDBWithQuery({ query }),
  ]);

  return { roomSubscriptions, total };
}
