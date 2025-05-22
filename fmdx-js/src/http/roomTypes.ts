import {z} from 'zod';

export interface IRoom {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  orgId: string;
  appId: string;
  name: string;
  nameLower: string;
  description?: string | null;
  clientTokenId?: string | null;
}

export interface IRoomSubscription {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  roomId: string;
  socketId: string | null;
  authId: string | null;
  appId: string;
  orgId: string;
  clientTokenId?: string | null;
}

export const addRoomSchema = z.object({
  appId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const deleteRoomSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
  name: z.string().optional(),
});

export const getRoomSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  name: z.string().optional(),
});

export const addRoomSubscriptionSchema = z.object({
  roomId: z.string().optional(),
  appId: z.string().optional(),
  roomName: z.string().optional(),
  socketId: z.string().optional(),
  authId: z.string().optional(),
});

export const getRoomSubscriptionsSchema = z.object({
  roomId: z.string().optional(),
  appId: z.string().optional(),
  roomName: z.string().optional(),
  socketId: z.string().optional(),
  authId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type AddRoomEndpointParams = z.infer<typeof addRoomSchema>;
export type DeleteRoomEndpointParams = z.infer<typeof deleteRoomSchema>;
export type GetRoomEndpointParams = z.infer<typeof getRoomSchema>;

export type AddRoomSubscriptionEndpointParams = z.infer<
  typeof addRoomSubscriptionSchema
>;
export type GetRoomSubscriptionsEndpointParams = z.infer<
  typeof getRoomSubscriptionsSchema
>;

export interface IAddRoomEndpointResult {
  room: IRoom;
}

export interface IGetRoomEndpointResult {
  room: IRoom;
}

export interface IAddRoomSubscriptionEndpointResult {
  roomSubscription: IRoomSubscription;
}

export interface IGetRoomSubscriptionsEndpointResult {
  roomSubscriptions: IRoomSubscription[];
  total: number;
}
