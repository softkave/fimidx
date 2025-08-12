import { z } from "zod";

export interface IOrg {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: string;
  updatedBy: string;
  updatedByType: string;
}

export const addOrgSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const updateOrgSchema = z.object({
  id: z.string(),
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const deleteOrgSchema = z.object({
  id: z.string(),
});

export const getOrgSchema = z.object({
  id: z.string(),
});

export const getOrgsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type AddOrgEndpointArgs = z.infer<typeof addOrgSchema>;
export type UpdateOrgEndpointArgs = z.infer<typeof updateOrgSchema>;
export type DeleteOrgEndpointArgs = z.infer<typeof deleteOrgSchema>;
export type GetOrgEndpointArgs = z.infer<typeof getOrgSchema>;
export type GetOrgsEndpointArgs = z.infer<typeof getOrgsSchema>;

export interface AddOrgEndpointResponse {
  org: IOrg;
}

export interface UpdateOrgEndpointResponse {
  success: boolean;
}

export interface GetOrgEndpointResponse {
  org: IOrg;
}

export interface GetOrgsEndpointResponse {
  orgs: IOrg[];
  page: number;
  limit: number;
  hasMore: boolean;
}
