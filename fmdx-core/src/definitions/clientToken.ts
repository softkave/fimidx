import { z } from "zod";
import {
  numberMetaQuerySchema,
  objPartQueryListSchema,
  objSortListSchema,
  stringMetaQuerySchema,
} from "./obj.js";

export interface IClientToken {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: string;
  updatedBy: string;
  updatedByType: string;
  appId: string;
  groupId: string;
  meta?: Record<string, string> | null;
  permissions: string[] | null;
}

export interface IClientTokenObjRecord {
  name: string;
  description?: string | null;
  meta?: Record<string, string> | null;
  permissions: string[] | null;
}

export const addClientTokenSchema = z.object({
  appId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  meta: z.record(z.string(), z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export const clientTokenQuerySchema = z.object({
  appId: z.string(),
  id: stringMetaQuerySchema.optional(),
  name: stringMetaQuerySchema.optional(),
  meta: objPartQueryListSchema.optional(),
  permissions: stringMetaQuerySchema.optional(),
  createdAt: numberMetaQuerySchema.optional(),
  updatedAt: numberMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
});

export const updateClientTokensSchema = z.object({
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    meta: z.record(z.string(), z.string()).optional(),
    permissions: z.array(z.string()).optional(),
  }),
  query: clientTokenQuerySchema,
  updateMany: z.boolean().optional(),
});

export const deleteClientTokensSchema = z.object({
  query: clientTokenQuerySchema,
  deleteMany: z.boolean().optional(),
});

export const getClientTokensSchema = z.object({
  query: clientTokenQuerySchema,
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: objSortListSchema.optional(),
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
export type UpdateClientTokensEndpointArgs = z.infer<
  typeof updateClientTokensSchema
>;
export type DeleteClientTokensEndpointArgs = z.infer<
  typeof deleteClientTokensSchema
>;
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

export interface GetClientTokensEndpointResponse {
  clientTokens: IClientToken[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface EncodeClientTokenJWTEndpointResponse {
  token: string;
  refreshToken?: string;
}

export interface RefreshClientTokenJWTEndpointResponse {
  token: string;
  refreshToken?: string;
}
