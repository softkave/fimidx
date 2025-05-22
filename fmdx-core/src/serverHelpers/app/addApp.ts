import { apps as appsTable, db } from "../../db/fmdx-schema.js";
import type { AddAppEndpointArgs } from "../../definitions/app.js";
import { checkAppAvailable } from "./checkAppExists.js";

export async function addApp(params: {
  args: AddAppEndpointArgs;
  userId: string;
  orgId: string;
}) {
  const { args, userId, orgId } = params;
  const { name, description } = args;
  const date = new Date();
  const newApp: typeof appsTable.$inferInsert = {
    name: name,
    nameLower: name.toLowerCase(),
    description: description ?? "",
    createdAt: date,
    updatedAt: date,
    createdBy: userId,
    updatedBy: userId,
    orgId: orgId,
  };

  await checkAppAvailable({ name, orgId });

  const app = await db.insert(appsTable).values(newApp).returning();
  return app[0];
}
