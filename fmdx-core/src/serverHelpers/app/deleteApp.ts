import { eq } from "drizzle-orm";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import { apps as appsTable, db } from "../../db/fmdx-schema.js";
import type { DeleteAppEndpointArgs } from "../../definitions/app.js";

export async function deleteApp(params: DeleteAppEndpointArgs) {
  const { id, orgId, acknowledgeDeleteAllForOrg } = params;

  if (id) {
    await db.delete(appsTable).where(eq(appsTable.id, id));
  } else if (orgId && acknowledgeDeleteAllForOrg) {
    await db.delete(appsTable).where(eq(appsTable.orgId, orgId));
  } else {
    throw new OwnServerError(
      "Invalid request",
      kOwnServerErrorCodes.InvalidRequest
    );
  }
}
