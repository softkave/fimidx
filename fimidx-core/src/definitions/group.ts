import { z } from "zod";
import {
  numberMetaQuerySchema,
  objPartQueryListSchema,
  objSortListSchema,
  stringMetaQuerySchema,
} from "./obj.js";

export interface IGroup {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: string;
  updatedBy: string;
  updatedByType: string;
  meta?: Record<string, string> | null;
  appId: string;
  groupId: string;
}

export interface IGroupObjRecord {
  name: string;
  description?: string | null;
  meta?: Record<string, string> | null;
}

export const addGroupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  meta: z.record(z.string(), z.string()).optional(),
  appId: z.string(),
});

export const groupQuerySchema = z.object({
  id: stringMetaQuerySchema.optional(),
  name: stringMetaQuerySchema.optional(),
  createdAt: numberMetaQuerySchema.optional(),
  updatedAt: numberMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
  meta: objPartQueryListSchema.optional(),
  appId: z.string(),
});

export const updateGroupsSchema = z.object({
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    meta: z.record(z.string(), z.string()).optional(),
  }),
  updateMany: z.boolean().optional(),
  query: groupQuerySchema,
});

export const deleteGroupsSchema = z.object({
  query: groupQuerySchema,
  deleteMany: z.boolean().optional(),
});

export const getGroupsSchema = z.object({
  query: groupQuerySchema,
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: objSortListSchema.optional(),
});

export type AddGroupEndpointArgs = z.infer<typeof addGroupSchema>;
export type UpdateGroupsEndpointArgs = z.infer<typeof updateGroupsSchema>;
export type DeleteGroupsEndpointArgs = z.infer<typeof deleteGroupsSchema>;
export type GetGroupsEndpointArgs = z.infer<typeof getGroupsSchema>;

export interface AddGroupEndpointResponse {
  group: IGroup;
}

export interface GetGroupsEndpointResponse {
  groups: IGroup[];
  page: number;
  limit: number;
  hasMore: boolean;
}
