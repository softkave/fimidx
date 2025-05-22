import { z } from "zod";

export interface IClientToken {
  id: string;
  name: string;
  nameLower: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  appId: string;
  orgId: string;
}

export const addClientTokenSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  appId: z.string(),
});

export const updateClientTokenSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const deleteClientTokenSchema = z.object({
  id: z.string().optional(),
  orgId: z.string().optional(),
  appId: z.string().optional(),
  acknowledgeDeleteAllInApp: z.boolean().optional(),
  acknowledgeDeleteAllInOrg: z.boolean().optional(),
});

export const getClientTokenSchema = z.object({
  id: z.string(),
});

export const getClientTokensSchema = z.object({
  appId: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const encodeClientTokenJWTSchema = z.object({
  id: z.string(),
  refresh: z.boolean().optional(),
  expiresAt: z.date().optional(),
});

export const refreshClientTokenJWTSchema = z.object({
  refreshToken: z.string(),
});

export type AddClientTokenEndpointArgs = z.infer<typeof addClientTokenSchema>;
export type UpdateClientTokenEndpointArgs = z.infer<
  typeof updateClientTokenSchema
>;
export type DeleteClientTokenEndpointArgs = z.infer<
  typeof deleteClientTokenSchema
>;
export type GetClientTokenEndpointArgs = z.infer<typeof getClientTokenSchema>;
export type GetClientTokensEndpointArgs = z.infer<typeof getClientTokensSchema>;
export type EncodeClientTokenJWTEndpointArgs = z.infer<
  typeof encodeClientTokenJWTSchema
>;
export type RefreshClientTokenJWTEndpointArgs = z.infer<
  typeof refreshClientTokenJWTSchema
>;

export interface AddClientTokenEndpointResponse {
  clientToken: IClientToken;
}

export interface GetClientTokenEndpointResponse {
  clientToken: IClientToken;
}

export interface GetClientTokensEndpointResponse {
  clientTokens: IClientToken[];
  total: number;
}

export interface UpdateClientTokenEndpointResponse {
  clientToken: IClientToken;
}

export interface EncodeClientTokenJWTEndpointResponse {
  token: string;
  refreshToken?: string;
}

export interface RefreshClientTokenJWTEndpointResponse {
  token: string;
  refreshToken?: string;
}
