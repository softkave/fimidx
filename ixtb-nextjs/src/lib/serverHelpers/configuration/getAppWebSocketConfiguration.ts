import {
  appWebSocketConfigurations as appWebSocketConfigurationsTable,
  db,
} from "@/src/db/fmlogs-schema";
import {
  GetAppWebSocketConfigurationEndpointArgs,
  getAppWebSocketConfigurationSchema,
} from "@/src/definitions/configurations";
import { and, eq } from "drizzle-orm";

export async function tryGetAppWebSocketConfiguration(
  args: GetAppWebSocketConfigurationEndpointArgs
) {
  const { appId, orgId } = getAppWebSocketConfigurationSchema.parse(args);

  const appWebSocketConfiguration = await db
    .select()
    .from(appWebSocketConfigurationsTable)
    .where(
      and(
        eq(appWebSocketConfigurationsTable.appId, appId),
        eq(appWebSocketConfigurationsTable.orgId, orgId)
      )
    );

  if (appWebSocketConfiguration.length === 0) {
    return null;
  }

  return appWebSocketConfiguration[0];
}
