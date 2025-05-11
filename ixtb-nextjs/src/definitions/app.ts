import { z } from "zod";

export interface IApp {
  id: string;
  name: string;
  nameLower: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  orgId: string;
}

export const addAppSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const updateAppSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const deleteAppSchema = z.object({
  id: z.string(),
});

export const getAppSchema = z.object({
  id: z.string(),
});

export const getAppsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type AddAppEndpointArgs = z.infer<typeof addAppSchema>;
export type UpdateAppEndpointArgs = z.infer<typeof updateAppSchema>;
export type DeleteAppEndpointArgs = z.infer<typeof deleteAppSchema>;
export type GetAppEndpointArgs = z.infer<typeof getAppSchema>;
export type GetAppsEndpointArgs = z.infer<typeof getAppsSchema>;

export interface AddAppEndpointResponse {
  app: IApp;
}

export interface GetAppsEndpointResponse {
  apps: IApp[];
  total: number;
}

export interface GetAppEndpointResponse {
  app: IApp;
}

export interface UpdateAppEndpointResponse {
  app: IApp;
}
