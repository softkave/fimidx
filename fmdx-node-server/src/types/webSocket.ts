import {ValueOf} from 'type-fest';
import {WebSocket} from 'ws';
import {z} from 'zod';

export interface AugmentedWebSocket extends WebSocket {
  __fmdxWebSocketId: string;
  __fmdxAuthId: string;
  __fmdxAppId: string;
  __fmdxOrgId: string;
  __fmdxIsAugmentedWebSocket: true;
}

export const kOutgoingWebSocketMessageType = {
  receivedMessage: 'receivedMessage',
  error: 'error',
} as const;

export type OutgoingWebSocketMessageType = ValueOf<
  typeof kOutgoingWebSocketMessageType
>;

export type IOutgoingWebSocketMessage = {
  type: typeof kOutgoingWebSocketMessageType.receivedMessage;
  message: string;
  roomId: string | null;
  fromServer: boolean | null;
};

export type IOutgoingWebSocketError = {
  type: typeof kOutgoingWebSocketMessageType.error;
  error: string;
};

export const kIncomingWebSocketMessageType = {
  sendMessage: 'sendMessage',
} as const;

export type IncomingWebSocketMessageType = ValueOf<
  typeof kIncomingWebSocketMessageType
>;

export const sendMessageSchema = z.object({
  type: z.literal(kIncomingWebSocketMessageType.sendMessage),
  message: z.string(),
  toRoomId: z.string().optional(),
  toSocketId: z.string().optional(),
  toServer: z.boolean().optional(),
  toAuthId: z.string().optional(),
});

export const incomingWebSocketMessageSchema = z.discriminatedUnion('type', [
  sendMessageSchema,
]);

export type IIncomingWebSocketMessage = z.infer<
  typeof incomingWebSocketMessageSchema
>;
