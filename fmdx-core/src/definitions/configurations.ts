import { z } from "zod";

export interface IAppWebSocketConfiguration {
  id: string;
  createdAt: number | Date;
  createdBy: string;
  updatedAt: number | Date;
  updatedBy: string;
  orgId: string;
  /** The app id */
  appId: string;
  /** The url to send messages to the server */
  sendMessageToServerUrl?: string | null;
  /** The headers to send to the server */
  sendMessageToServerHeaders?: Record<string, string> | null;
  /** Whether to allow web sockets without auth ids */
  allowWebSocketsWithoutAuthIds: boolean;
}

export const addAppWebSocketConfigurationSchema = z.object({
  appId: z.string(),
  allowWebSocketsWithoutAuthIds: z.boolean(),
  sendMessageToServerUrl: z.string().optional(),
  sendMessageToServerHeaders: z.record(z.string(), z.string()).optional(),
});

export const getAppWebSocketConfigurationSchema = z.object({
  appId: z.string(),
});

export type AddAppWebSocketConfigurationEndpointArgs = z.infer<
  typeof addAppWebSocketConfigurationSchema
>;
export type GetAppWebSocketConfigurationEndpointArgs = z.infer<
  typeof getAppWebSocketConfigurationSchema
>;

export interface IAddAppWebSocketConfigurationEndpointResponse {
  appWebSocketConfiguration: IAppWebSocketConfiguration;
}

export interface IGetAppWebSocketConfigurationEndpointResponse {
  appWebSocketConfiguration: IAppWebSocketConfiguration | null;
}
