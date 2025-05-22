import { z } from "zod";

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

export const getRoomsSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const addRoomSubscriptionSchema = z.object({
  roomId: z.string().optional(),
  appId: z.string().optional(),
  roomName: z.string().optional(),
  socketId: z.string().optional(),
  authId: z.string().optional(),
});

export const deleteRoomSubscriptionSchema = z.object({
  roomId: z.string().optional(),
  appId: z.string().optional(),
  roomName: z.string().optional(),
  socketId: z.string().optional(),
  authId: z.string().optional(),
  acknowledgeDeleteAllInRoom: z.boolean().optional(),
  acknowledgeDeleteAllForAuthId: z.boolean().optional(),
  acknowledgeDeleteAllForSocketId: z.boolean().optional(),
  acknowledgeDeleteAllForApp: z.boolean().optional(),
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

export type AddRoomEndpointArgs = z.infer<typeof addRoomSchema>;
export type DeleteRoomEndpointArgs = z.infer<typeof deleteRoomSchema>;
export type GetRoomEndpointArgs = z.infer<typeof getRoomSchema>;
export type GetRoomsEndpointArgs = z.infer<typeof getRoomsSchema>;

export type AddRoomSubscriptionEndpointArgs = z.infer<
  typeof addRoomSubscriptionSchema
>;
export type DeleteRoomSubscriptionEndpointArgs = z.infer<
  typeof deleteRoomSubscriptionSchema
>;
export type GetRoomSubscriptionsEndpointArgs = z.infer<
  typeof getRoomSubscriptionsSchema
>;

export interface IAddRoomEndpointResponse {
  room: IRoom;
}

export interface IGetRoomEndpointResponse {
  room: IRoom;
}

export interface IGetRoomsEndpointResponse {
  rooms: IRoom[];
  total: number;
}

export interface IAddRoomSubscriptionEndpointResponse {
  roomSubscription: IRoomSubscription;
}

export interface IGetRoomSubscriptionsEndpointResponse {
  roomSubscriptions: IRoomSubscription[];
  total: number;
}
