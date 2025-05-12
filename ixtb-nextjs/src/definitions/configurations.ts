import { ValueOf } from "type-fest";
import { z } from "zod";

export const kWebSocketAccessType = {
  public: "public",
  authenticated: "authenticated",
  authorized: "authorized",
} as const;

export type WebSocketAccessType = ValueOf<typeof kWebSocketAccessType>;

export interface IAppWebSocketConfiguration {
  id: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  orgId: string;
  /** The app id */
  appId: string;
  /** The websocket access type */
  websocketAccessType: WebSocketAccessType;
}

export const kWebSocketAccessTypeSchema = z.nativeEnum(kWebSocketAccessType);

export const addAppWebSocketConfigurationSchema = z.object({
  appId: z.string(),
  websocketAccessType: kWebSocketAccessTypeSchema.optional(),
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
  appWebSocketConfiguration: IAppWebSocketConfiguration;
}
