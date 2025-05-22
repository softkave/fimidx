import { z } from "zod";

export interface IWebSocketMessage {
  id: string;
  orgId: string;
  appId: string;
  fromSocketId?: string | null;
  fromServer?: boolean | null;
  fromAuthId?: string | null;
  toSocketId?: string | null;
  toRoomId?: string | null;
  toServer?: boolean | null;
  toAuthId?: string | null;
  message: string;
  createdAt: Date | number;
}

export const getWebSocketMessagesSchema = z.object({
  appId: z.string(),
  fromSocketId: z.string().optional(),
  fromAuthId: z.string().optional(),
  toRoomId: z.string().optional(),
  toSocketId: z.string().optional(),
  toAuthId: z.string().optional(),
  toServer: z.boolean().optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
});

export type GetWebSocketMessagesEndpointArgs = z.infer<
  typeof getWebSocketMessagesSchema
>;

export interface IGetWebSocketMessagesEndpointResponse {
  messages: IWebSocketMessage[];
  total: number;
}
