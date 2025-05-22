import { count, eq } from "drizzle-orm";
import { db, rooms as roomTable } from "../../db/fmdx-schema.js";
import type { GetRoomsEndpointArgs } from "../../definitions/room.js";

async function getRoomsFromDB(params: {
  limitNumber: number;
  pageNumber: number;
  appId: string;
}) {
  const { limitNumber, pageNumber, appId } = params;
  const rooms = await db
    .select()
    .from(roomTable)
    .where(eq(roomTable.appId, appId))
    .limit(limitNumber)
    .offset((pageNumber - 1) * limitNumber);

  return rooms;
}

async function countRoomsInDB(params: { appId: string }) {
  const { appId } = params;
  const roomCount = await db
    .select({ count: count() })
    .from(roomTable)
    .where(eq(roomTable.appId, appId));

  return roomCount[0].count;
}

export async function getRoomList(params: GetRoomsEndpointArgs) {
  const { page, limit, appId } = params;

  const pageNumber = page ?? 1;
  const limitNumber = limit ?? 10;

  const [rooms, total] = await Promise.all([
    getRoomsFromDB({ limitNumber, pageNumber, appId }),
    countRoomsInDB({ appId }),
  ]);

  return {
    rooms,
    total,
  };
}
