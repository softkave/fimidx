import { z } from "zod";

export interface IWebSocketMessage {
  id: string;
  orgId: string;
  appId: string;
  roomId?: string;
  fromSocketId?: string;
  fromHashedAuthId?: string;
  toSocketId?: string;
  toHashedAuthId?: string;
  message: string;
  createdAt: Date | number;
}

export interface IWebSocketMessageAck {
  id: string;
  acked: boolean;
  ackedAt: Date | number;
  messageId: string;
  socketId: string;
}

export const getWebSocketMessagesSchema = z.object({
  appId: z.string().optional(),
  roomId: z.string().optional(),
  fromSocketId: z.string().optional(),
  fromHashedAuthId: z.string().optional(),
  toSocketId: z.string().optional(),
  toHashedAuthId: z.string().optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
});

export const getWebSocketMessagesAckSchema = z.object({
  messageId: z.string().optional(),
  socketId: z.string().optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
});

export type GetWebSocketMessagesEndpointArgs = z.infer<
  typeof getWebSocketMessagesSchema
>;
export type GetWebSocketMessagesAckEndpointArgs = z.infer<
  typeof getWebSocketMessagesAckSchema
>;

export interface IGetWebSocketMessagesEndpointResponse {
  messages: IWebSocketMessage[];
  total: number;
}

export interface IGetWebSocketMessagesAckEndpointResponse {
  messages: IWebSocketMessageAck[];
  total: number;
}
