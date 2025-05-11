import { apps as appsTable, db } from "@/src/db/fmlogs-schema";
import { UpdateAppEndpointArgs } from "@/src/definitions/app";
import { eq } from "drizzle-orm";
import { checkAppAvailable } from "./checkAppExists";
import { getApp } from "./getApp";

export async function updateApp(params: {
  args: UpdateAppEndpointArgs;
  id: string;
  userId: string;
  orgId: string;
}) {
  const { args, id, userId, orgId } = params;
  const { name, description } = args;

  const app = await getApp({ id, orgId });

  if (name) {
    await checkAppAvailable({ name, orgId, isId: id });
  }

  const [updatedApp] = await db
    .update(appsTable)
    .set({
      name: name ?? app.name,
      description: description ?? app.description,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(appsTable.id, id))
    .returning();

  return updatedApp;
}
