import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { apps as appTable, db } from "../../db/fmdx-schema.js";

export async function checkAppExists(params: {
  name: string;
  isId?: string;
  orgId: string;
}) {
  const [app] = await db
    .select({
      id: appTable.id,
      name: appTable.name,
    })
    .from(appTable)
    .where(
      and(
        eq(appTable.nameLower, params.name.toLowerCase()),
        eq(appTable.orgId, params.orgId)
      )
    );

  const isId = app && params.isId === app.id;

  return {
    exists: !!app,
    isId,
  };
}

export async function checkAppAvailable(params: {
  name: string;
  isId?: string;
  orgId: string;
}) {
  const { exists, isId } = await checkAppExists(params);

  if (exists && !isId) {
    throw new OwnServerError("App already exists", 400);
  }

  return {
    exists,
    isId,
  };
}
