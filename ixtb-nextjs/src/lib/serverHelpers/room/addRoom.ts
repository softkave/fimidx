import { db, rooms as roomTable } from "@/src/db/fmlogs-schema";
import { AddRoomEndpointArgs } from "@/src/definitions/room";
import { eq } from "drizzle-orm";
import { tryGetRoom } from "./getRoom";

export async function addRoom(params: {
  args: AddRoomEndpointArgs;
  orgId: string;
  clientTokenId: string;
}) {
  const { args, orgId, clientTokenId } = params;
  const { name, description, accessType, appId } = args;

  const existingRoom = await tryGetRoom({ name, appId });
  if (existingRoom) {
    const updatedRoom = await db
      .update(roomTable)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(roomTable.id, existingRoom.id))
      .returning();
    return updatedRoom[0];
  } else {
    const date = new Date();
    const newRoom: typeof roomTable.$inferInsert = {
      name,
      nameLower: name.toLowerCase(),
      description,
      accessType,
      createdAt: date,
      updatedAt: date,
      orgId,
      appId,
      clientTokenId,
    };

    const [room] = await db.insert(roomTable).values(newRoom).returning();
    return room;
  }
}
