import { z } from "zod";

export interface IConnectedWebSocket {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  orgId: string;
  appId: string;
  /** The auth id of the connected socket. It's null if the socket is not
   * connected to a auth id and app is configured to allow anonymous access */
  authId: string | null;
}

export interface IAuthId {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  /** wildcard allows all sockets */
  authId: string;
  /** The name of the auth id to facilitate debugging */
  name: string;
  /** The description of the auth id to facilitate debugging */
  description?: string | null;
  appId: string;
  orgId: string;
  clientTokenId: string;
}

export interface IConnectedAuthItem {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
  orgId: string;
  appId: string;
  /** The client token id that added the auth item */
  clientTokenId: string;
  authId: string;
  /** The room id it's allowed to message. wilcard allows all rooms */
  messageRoomId?: string | null;
  /** The socket id it's allowed to message. wilcard allows all sockets */
  messageSocketId?: string | null;
  /** Whether it's allowed to message the server */
  messageServer?: boolean | null;
  /** This auth id is allowed to message any socket that's a part of this room.
   * wilcard allows all rooms */
  messageRoomSocket?: string | null;
  /** This auth id is allowed to message any socket associated with this auth
   * id. wilcard allows all auth ids */
  messageAuthId?: string | null;
}

export const deleteAuthIdSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  authId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
});

export const getAuthIdSchema = z.object({
  id: z.string().optional(),
  authId: z.string().optional(),
  appId: z.string().optional(),
});

export const getAuthIdsSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const addAuthItemSchema = z.object({
  roomId: z.string().nullable().optional(),
  messageRoomId: z.string().nullable().optional(),
  messageSocketId: z.string().nullable().optional(),
  messageServer: z.boolean().nullable().optional(),
  messageRoomSocket: z.string().nullable().optional(),
  messageAuthId: z.string().nullable().optional(),
});

export const addMultipleAuthItemsSchema = z.object({
  appId: z.string(),
  authId: z.string(),
  authItems: z.array(addAuthItemSchema),
});

export const deleteAuthItemSchema = z.object({
  id: z.string().optional(),
  authId: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
  acknowledgeDeleteAllForAuthId: z.boolean().optional(),
});

export const getAuthItemsSchema = z.object({
  appId: z.string(),
  authId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const addAuthIdSchema = z.object({
  appId: z.string(),
  authId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  authItems: z.array(addAuthItemSchema).optional(),
});

export const getConnectedWebSocketsSchema = z.object({
  appId: z.string(),
  authId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const disconnectWebSocketSchema = z.object({
  id: z.string().optional(),
  authId: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDisconnectAllInApp: z.boolean().optional(),
  acknowledgeDisconnectAllForAuthId: z.boolean().optional(),
});

export type AddAuthIdEndpointArgs = z.infer<typeof addAuthIdSchema>;
export type DeleteAuthIdEndpointArgs = z.infer<typeof deleteAuthIdSchema>;
export type GetAuthIdEndpointArgs = z.infer<typeof getAuthIdSchema>;
export type GetAuthIdsEndpointArgs = z.infer<typeof getAuthIdsSchema>;

export type AddMultipleAuthItemsEndpointArgs = z.infer<
  typeof addMultipleAuthItemsSchema
>;
export type DeleteAuthItemEndpointArgs = z.infer<typeof deleteAuthItemSchema>;
export type GetAuthItemsEndpointArgs = z.infer<typeof getAuthItemsSchema>;

export type GetConnectedWebSocketsEndpointArgs = z.infer<
  typeof getConnectedWebSocketsSchema
>;
export type DisconnectWebSocketEndpointArgs = z.infer<
  typeof disconnectWebSocketSchema
>;

export interface IAddAuthIdEndpointResponse {
  authId: IAuthId;
}

export interface IGetAuthIdEndpointResponse {
  authId: IAuthId;
}

export interface IGetAuthIdsEndpointResponse {
  authIds: IAuthId[];
  total: number;
}

export interface IAddMultipleAuthItemsEndpointResponse {
  authItems: IConnectedAuthItem[];
}

export interface IGetAuthItemsEndpointResponse {
  authItems: IConnectedAuthItem[];
  total: number;
}

export interface IGetConnectedWebSocketsEndpointResponse {
  connectedWebSockets: IConnectedWebSocket[];
  total: number;
}
