import { z } from "zod";
import {
  numberMetaQuerySchema,
  objSortListSchema,
  stringMetaQuerySchema,
} from "./obj.js";

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
  orgId: string;
  objFieldsToIndex: string[] | null;
}

export interface IAppObjRecord {
  name: string;
  description?: string | null;
  orgId: string;
  objFieldsToIndex: string[] | null;
}

export const addAppSchema = z.object({
  orgId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  objFieldsToIndex: z.array(z.string()).optional(),
});

// TODO: appId shouldn't be optional for external use
export const appQuerySchema = z.object({
  orgId: z.string().optional(),
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
    objFieldsToIndex: z.array(z.string()).optional().nullable(),
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
  sort: objSortListSchema.optional(),
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
  success: boolean;
}
