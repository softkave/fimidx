import { eq } from "drizzle-orm";
import { apps as appsTable, db } from "../../db/fmdx-schema.js";
import type { IApp, UpdateAppEndpointArgs } from "../../definitions/app.js";
import { checkAppAvailable } from "./checkAppExists.js";
import { getApp } from "./getApp.js";

export async function updateApp(params: {
  args: UpdateAppEndpointArgs;
  userId: string;
  existingApp?: IApp;
}) {
  const { args, userId, existingApp } = params;
  const { name, description, id } = args;

  const app = existingApp ?? (await getApp({ id }));

  if (name) {
    await checkAppAvailable({ name, orgId: app.orgId, isId: id });
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
