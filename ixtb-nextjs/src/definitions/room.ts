import { ValueOf } from "type-fest";
import { z } from "zod";

export const kRoomAccessType = {
  public: "public",
  authenticated: "authenticated",
  authorized: "authorized",
} as const;

export type RoomAccessType = ValueOf<typeof kRoomAccessType>;

export interface IRoom {
  id: string;
  createdAt: number;
  updatedAt: number;
  orgId: string;
  appId: string;
  accessType: RoomAccessType;
  name: string;
  nameLower: string;
  description?: string;
  clientTokenId?: string;
}

export interface IRoomSubscription {
  id: string;
  createdAt: number;
  updatedAt: number;
  roomId: string;
  /** The socket id of the subscription. It's null if the subscription is for a hashed auth id. */
  socketId: string | null;
  /** The hashed auth id of the subscription. It's null if the subscription is for a socket id. */
  hashedAuthId: string | null;
  appId: string;
  orgId: string;
}

export const addRoomSchema = z.object({
  appId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  accessType: z.nativeEnum(kRoomAccessType),
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
  hashedAuthId: z.string().optional(),
});

export const deleteRoomSubscriptionSchema = z.object({
  roomId: z.string().optional(),
  appId: z.string().optional(),
  roomName: z.string().optional(),
  socketId: z.string().optional(),
  hashedAuthId: z.string().optional(),
  acknowledgeDeleteAllInRoom: z.boolean().optional(),
  acknowledgeDeleteAllForHashedAuthId: z.boolean().optional(),
  acknowledgeDeleteAllForSocketId: z.boolean().optional(),
  acknowledgeDeleteAllForApp: z.boolean().optional(),
});

export const getRoomSubscriptionsSchema = z.object({
  roomId: z.string().optional(),
  appId: z.string().optional(),
  roomName: z.string().optional(),
  socketId: z.string().optional(),
  hashedAuthId: z.string().optional(),
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
