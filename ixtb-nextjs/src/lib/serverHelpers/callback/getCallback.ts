import { callbacks as callbackTable, db } from "@/src/db/fmlogs-schema";
import assert from "assert";
import { and, eq } from "drizzle-orm";
import { OwnServerError } from "../../common/error";

export async function getCallback(params: {
  id: string;
  orgId: string;
  appId: string;
}) {
  const { id, orgId, appId } = params;

  const [callback] = await db
    .select()
    .from(callbackTable)
    .where(
      and(
        eq(callbackTable.id, id),
        eq(callbackTable.orgId, orgId),
        eq(callbackTable.appId, appId)
      )
    )
    .limit(1);

  assert(callback, new OwnServerError("Callback not found", 404));
  return callback;
}
