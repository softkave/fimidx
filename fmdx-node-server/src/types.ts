import {z} from 'zod';

export type WsResponse =
  | {
      messageId?: string;
      type: 'error';
      message: string;
    }
  | {
      messageId: string;
      type: 'ack';
      message: string;
    }
  | {
      messageId: string;
      type: 'roomList';
      roomList: string[];
    }
  | {
      messageId: string;
      type: 'roomExists';
      exists: boolean;
    };

export const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    messageId: z.string(),
    type: z.literal('createRoom'),
    roomId: z.string(),
  }),
  z.object({
    messageId: z.string(),
    type: z.literal('joinRoom'),
    roomId: z.string(),
    createIfMissing: z.boolean().optional(),
  }),
  z.object({
    messageId: z.string(),
    type: z.literal('leaveRoom'),
    roomId: z.string(),
  }),
  z.object({
    messageId: z.string(),
    type: z.literal('sendMessageToRoom'),
    roomId: z.string(),
    message: z.string(),
  }),
  z.object({
    messageId: z.string(),
    type: z.literal('getRoomList'),
  }),
  z.object({
    messageId: z.string(),
    type: z.literal('leaveAllRooms'),
  }),
  z.object({
    messageId: z.string(),
    type: z.literal('roomExists'),
    roomId: z.string(),
  }),
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;
