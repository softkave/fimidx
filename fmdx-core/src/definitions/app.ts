import { z } from "zod";
import { numberMetaQuerySchema, stringMetaQuerySchema } from "./obj.js";

export interface IApp {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: string;
  updatedBy: string;
  updatedByType: string;
  groupId: string;
}

export interface IAppObjRecord {
  name: string;
  description?: string | null;
  groupId: string;
}

export const addAppSchema = z.object({
  groupId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const appQuerySchema = z.object({
  groupId: z.string(),
  id: stringMetaQuerySchema.optional(),
  name: stringMetaQuerySchema.optional(),
  createdAt: numberMetaQuerySchema.optional(),
  updatedAt: numberMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
});

export const updateAppsSchema = z.object({
  query: appQuerySchema,
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  updateMany: z.boolean().optional(),
});

export const deleteAppsSchema = z.object({
  query: appQuerySchema,
  deleteMany: z.boolean().optional(),
});

export const getAppsSchema = z.object({
  query: appQuerySchema,
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type AddAppEndpointArgs = z.infer<typeof addAppSchema>;
export type UpdateAppsEndpointArgs = z.infer<typeof updateAppsSchema>;
export type DeleteAppsEndpointArgs = z.infer<typeof deleteAppsSchema>;
export type GetAppsEndpointArgs = z.infer<typeof getAppsSchema>;

export interface AddAppEndpointResponse {
  app: IApp;
}

export interface GetAppsEndpointResponse {
  apps: IApp[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetAppEndpointResponse {
  app: IApp;
}

export interface UpdateAppEndpointResponse {
  app: IApp;
}
