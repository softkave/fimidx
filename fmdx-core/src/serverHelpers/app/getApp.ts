import assert from "assert";
import { eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error.js";
import { apps as appsTable, db } from "../../db/fmdx-schema.js";

export async function getApp(params: { id: string }) {
  const { id } = params;

  const [app] = await db
    .select()
    .from(appsTable)
    .where(eq(appsTable.id, id))
    .limit(1);

  assert(app, new OwnServerError("App not found", 404));
  return app;
}
