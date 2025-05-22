import { eq } from "drizzle-orm";
import {
  appWebSocketConfigurations as appWebSocketConfigurationsTable,
  db,
} from "../../db/fmdx-schema.js";
import type { AddAppWebSocketConfigurationEndpointArgs } from "../../definitions/configurations.js";
import { tryGetAppWebSocketConfiguration } from "./getAppWebSocketConfiguration.js";

export async function addAppWebSocketConfiguration(params: {
  args: AddAppWebSocketConfigurationEndpointArgs;
  userId: string;
  orgId: string;
}) {
  const { args, userId, orgId } = params;
  const {
    appId,
    sendMessageToServerUrl,
    sendMessageToServerHeaders,
    allowWebSocketsWithoutAuthIds,
  } = args;

  const existingAppWebSocketConfiguration =
    await tryGetAppWebSocketConfiguration({
      args: { appId },
    });

  if (existingAppWebSocketConfiguration) {
    const appWebSocketConfiguration = await db
      .update(appWebSocketConfigurationsTable)
      .set({
        allowWebSocketsWithoutAuthIds:
          allowWebSocketsWithoutAuthIds ??
          existingAppWebSocketConfiguration.allowWebSocketsWithoutAuthIds,
        sendMessageToServerUrl:
          sendMessageToServerUrl ??
          existingAppWebSocketConfiguration.sendMessageToServerUrl,
        sendMessageToServerHeaders:
          sendMessageToServerHeaders ??
          existingAppWebSocketConfiguration.sendMessageToServerHeaders,
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
        allowWebSocketsWithoutAuthIds,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        orgId,
        sendMessageToServerUrl,
        sendMessageToServerHeaders,
      };

    const appWebSocketConfiguration = await db
      .insert(appWebSocketConfigurationsTable)
      .values(newAppWebSocketConfiguration)
      .returning();

    return appWebSocketConfiguration[0];
  }
}
