import { apps as appsTable, db } from "@/src/db/fmlogs-schema";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function getApp(params: { id: string; orgId: string }) {
  const { id, orgId } = params;

  const [app] = await db
    .select()
    .from(appsTable)
    .where(and(eq(appsTable.id, id), eq(appsTable.orgId, orgId)))
    .limit(1);

  assert(app, new OwnServerError("App not found", 404));
  return app;
}
