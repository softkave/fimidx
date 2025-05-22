import { eq } from "drizzle-orm";
import {
  appWebSocketConfigurations as appWebSocketConfigurationsTable,
  db,
} from "../../db/fmdx-schema.js";
import {
  getAppWebSocketConfigurationSchema,
  type GetAppWebSocketConfigurationEndpointArgs,
} from "../../definitions/configurations.js";

export async function tryGetAppWebSocketConfiguration(params: {
  args: GetAppWebSocketConfigurationEndpointArgs;
}) {
  const { args } = params;
  const { appId } = getAppWebSocketConfigurationSchema.parse(args);

  const appWebSocketConfiguration = await db
    .select()
    .from(appWebSocketConfigurationsTable)
    .where(eq(appWebSocketConfigurationsTable.appId, appId));

  if (appWebSocketConfiguration.length === 0) {
    return null;
  }

  return appWebSocketConfiguration[0];
}
