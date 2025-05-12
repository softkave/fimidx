import { ValueOf } from "type-fest";
import { z } from "zod";

export interface IConnectedWebSocket {
  id: string;
  createdAt: number;
  updatedAt: number;
  socketId: string;
  orgId: string;
  appId: string;
  /** The hashed auth id of the connected socket. It's null if the socket is not
   * connected to a hashed auth id and app is configured to allow anonymous
   * access */
  hashedAuthId: string | null;
}

export const kHashedAuthIdUsage = {
  singleSocket: "single-socket",
  multipleSockets: "multiple-sockets",
} as const;

export type HashedAuthIdUsage = ValueOf<typeof kHashedAuthIdUsage>;

export interface IHashedAuthId {
  id: string;
  createdAt: number;
  updatedAt: number;
  hashedAuthId: string;
  usage: HashedAuthIdUsage;
  /** The name of the hashed auth id to facilitate debugging */
  name: string;
  /** The description of the hashed auth id to facilitate debugging */
  description?: string;
  appId: string;
  orgId: string;
  clientTokenId: string;
}

export const kConnectedAuthItemAccessType = {
  wildcard: "*",
  /** Consume messages from the room */
  consume: "consume",
  /** Publish messages to the room */
  publish: "publish",
  /** Message a specific socket in the room */
  messageRoomSocket: "msg-room-socket",
  /** Message any connected socket */
  messageAnySocket: "msg-any-socket",
} as const;

export type ConnectedAuthItemAccessType = ValueOf<
  typeof kConnectedAuthItemAccessType
>;

export interface IConnectedAuthItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  orgId: string;
  appId: string;
  /** The client token id that added the auth item */
  clientTokenId: string;
  hashedAuthId: string;
  /** "*" will match all rooms and `null` will match no rooms e.g. for
   * socket-to-socket messages */
  roomId: string | null;
  accessType: ConnectedAuthItemAccessType;
}

export const deleteHashedAuthIdSchema = z.object({
  id: z.string().optional(),
  appId: z.string().optional(),
  hashedAuthId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
});

export const getHashedAuthIdSchema = z.object({
  id: z.string().optional(),
  hashedAuthId: z.string().optional(),
  appId: z.string().optional(),
});

export const getHashedAuthIdsSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const kConnectedAuthItemAccessTypeSchema = z.nativeEnum(
  kConnectedAuthItemAccessType
);

export const addAuthItemSchema = z.object({
  roomId: z.string().nullable().optional(),
  accessType: kConnectedAuthItemAccessTypeSchema,
});

export const addMultipleAuthItemsSchema = z.object({
  appId: z.string(),
  hashedAuthId: z.string(),
  authItems: z.array(addAuthItemSchema),
});

export const deleteAuthItemSchema = z.object({
  id: z.string().optional(),
  hashedAuthId: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
  acknowledgeDeleteAllForHashedAuthId: z.boolean().optional(),
});

export const getAuthItemsSchema = z.object({
  appId: z.string(),
  hashedAuthId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const addHashedAuthIdSchema = z.object({
  appId: z.string(),
  hashedAuthId: z.string(),
  usage: z.nativeEnum(kHashedAuthIdUsage),
  name: z.string(),
  description: z.string().optional(),
  authItems: z.array(addAuthItemSchema).optional(),
});

export const getConnectedSocketsSchema = z.object({
  appId: z.string(),
  hashedAuthId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const disconnectSocketSchema = z.object({
  socketId: z.string().optional(),
  hashedAuthId: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDisconnectAllInApp: z.boolean().optional(),
  acknowledgeDisconnectAllForHashedAuthId: z.boolean().optional(),
});

export type AddHashedAuthIdEndpointArgs = z.infer<typeof addHashedAuthIdSchema>;
export type DeleteHashedAuthIdEndpointArgs = z.infer<
  typeof deleteHashedAuthIdSchema
>;
export type GetHashedAuthIdEndpointArgs = z.infer<typeof getHashedAuthIdSchema>;
export type GetHashedAuthIdsEndpointArgs = z.infer<
  typeof getHashedAuthIdsSchema
>;

export type AddMultipleAuthItemsEndpointArgs = z.infer<
  typeof addMultipleAuthItemsSchema
>;
export type DeleteAuthItemEndpointArgs = z.infer<typeof deleteAuthItemSchema>;
export type GetAuthItemsEndpointArgs = z.infer<typeof getAuthItemsSchema>;

export type GetConnectedSocketsEndpointArgs = z.infer<
  typeof getConnectedSocketsSchema
>;
export type DisconnectSocketEndpointArgs = z.infer<
  typeof disconnectSocketSchema
>;

export interface IAddHashedAuthIdEndpointResponse {
  hashedAuthId: IHashedAuthId;
}

export interface IGetHashedAuthIdEndpointResponse {
  hashedAuthId: IHashedAuthId;
}

export interface IGetHashedAuthIdsEndpointResponse {
  hashedAuthIds: IHashedAuthId[];
  total: number;
}

export interface IAddMultipleAuthItemsEndpointResponse {
  authItems: IConnectedAuthItem[];
}

export interface IGetAuthItemsEndpointResponse {
  authItems: IConnectedAuthItem[];
  total: number;
}

export interface IGetConnectedSocketsEndpointResponse {
  connectedSockets: IConnectedWebSocket[];
  total: number;
}
