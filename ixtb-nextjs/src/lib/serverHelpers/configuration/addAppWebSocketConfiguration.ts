import {
  appWebSocketConfigurations as appWebSocketConfigurationsTable,
  db,
} from "@/src/db/fmlogs-schema";
import {
  AddAppWebSocketConfigurationEndpointArgs,
  kWebSocketAccessType,
} from "@/src/definitions/configurations";
import { eq } from "drizzle-orm";
import { tryGetAppWebSocketConfiguration } from "./getAppWebSocketConfiguration";

export async function addAppWebSocketConfiguration(params: {
  args: AddAppWebSocketConfigurationEndpointArgs;
  userId: string;
}) {
  const { args, userId } = params;
  const { appId, websocketAccessType, orgId } = args;

  const existingAppWebSocketConfiguration =
    await tryGetAppWebSocketConfiguration({
      appId,
      orgId,
    });

  if (existingAppWebSocketConfiguration) {
    const appWebSocketConfiguration = await db
      .update(appWebSocketConfigurationsTable)
      .set({
        websocketAccessType:
          websocketAccessType ??
          existingAppWebSocketConfiguration.websocketAccessType,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(
        eq(
          appWebSocketConfigurationsTable.id,
          existingAppWebSocketConfiguration.id
        )
      )
      .returning();

    return appWebSocketConfiguration[0];
  } else {
    const newAppWebSocketConfiguration: typeof appWebSocketConfigurationsTable.$inferInsert =
      {
        appId,
        websocketAccessType:
          websocketAccessType ?? kWebSocketAccessType.authorized,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        orgId,
      };

    const appWebSocketConfiguration = await db
      .insert(appWebSocketConfigurationsTable)
      .values(newAppWebSocketConfiguration)
      .returning();

    return appWebSocketConfiguration[0];
  }
}
