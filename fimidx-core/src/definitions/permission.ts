import { z } from "zod";
import {
  numberMetaQuerySchema,
  objPartQueryListSchema,
  objSortListSchema,
  stringMetaQuerySchema,
} from "./obj.js";

export const kFimidxPermissions = {
  wildcard: "*",
  group: {
    read: "group:read",
    update: "group:update",
    delete: "group:delete",
  },
  app: {
    read: "app:read",
    update: "app:update",
    delete: "app:delete",
  },
  member: {
    read: "member:read",
    readPermissions: "member:readPermissions",
    update: "member:update",
    invite: "member:invite",
    remove: "member:remove",
  },
  log: {
    read: "log:read",
    ingest: "log:ingest",
  },
  clientToken: {
    read: "clientToken:read",
    readPermissions: "clientToken:readPermissions",
    update: "clientToken:update",
    delete: "clientToken:delete",
  },
  monitor: {
    read: "monitor:read",
    update: "monitor:update",
    delete: "monitor:delete",
  },
  callback: {
    read: "callback:read",
    update: "callback:update",
    delete: "callback:delete",
  },
  obj: {
    read: "obj:read",
    update: "obj:update",
    delete: "obj:delete",
  },
  permission: {
    read: "permission:read",
    update: "permission:update",
    delete: "permission:delete",
  },
};

export const kFimidxPermissionsList = [
  kFimidxPermissions.wildcard,
  kFimidxPermissions.group.update,
  kFimidxPermissions.group.delete,
  kFimidxPermissions.app.read,
  kFimidxPermissions.app.update,
  kFimidxPermissions.app.delete,
  kFimidxPermissions.member.read,
  kFimidxPermissions.member.readPermissions,
  kFimidxPermissions.member.update,
  kFimidxPermissions.member.invite,
  kFimidxPermissions.member.remove,
  kFimidxPermissions.log.read,
  kFimidxPermissions.log.ingest,
  kFimidxPermissions.clientToken.read,
  kFimidxPermissions.clientToken.readPermissions,
  kFimidxPermissions.clientToken.update,
  kFimidxPermissions.clientToken.delete,
  kFimidxPermissions.monitor.read,
  kFimidxPermissions.monitor.update,
  kFimidxPermissions.monitor.delete,
  kFimidxPermissions.callback.read,
  kFimidxPermissions.callback.update,
  kFimidxPermissions.callback.delete,
  kFimidxPermissions.obj.read,
  kFimidxPermissions.obj.update,
  kFimidxPermissions.obj.delete,
];

export type IPermissionEntity = Record<string, string> | string;
export type IPermissionAction = Record<string, string> | string;
export type IPermissionTarget = Record<string, string> | string;

export type IPermissionAtom = {
  entity: IPermissionEntity;
  action: IPermissionAction;
  target: IPermissionTarget;
};

export type IPermissionMeta = Record<string, string> | null;

export interface IPermission extends IPermissionAtom {
  id: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: string;
  updatedBy: string;
  updatedByType: string;
  appId: string;
  groupId: string;
  meta?: IPermissionMeta;
}

export interface IPermissionObjRecord {
  entity: IPermissionEntity;
  action: IPermissionAction;
  target: IPermissionTarget;
  description?: string | null;
  meta?: IPermissionMeta;
}

export const entitySchema = z.record(z.string(), z.string()).or(z.string());
export const actionSchema = entitySchema;
export const targetSchema = entitySchema;

export const permissionAtomSchema = z.object({
  entity: entitySchema,
  action: actionSchema,
  target: targetSchema,
});

export const addPermissionItemSchema = permissionAtomSchema.extend({
  description: z.string().optional(),
  meta: z.record(z.string(), z.string()).optional().nullable().or(z.null()),
});

export const addPermissionsSchema = z.object({
  appId: z.string(),
  permissions: z.array(addPermissionItemSchema),
});

export const entityQuerySchema = stringMetaQuerySchema.or(
  objPartQueryListSchema
);
export const actionQuerySchema = entityQuerySchema;
export const targetQuerySchema = entityQuerySchema;

export const permissionQuerySchema = z.object({
  appId: z.string(),
  id: stringMetaQuerySchema.optional(),
  entity: entityQuerySchema.optional(),
  action: actionQuerySchema.optional(),
  target: targetQuerySchema.optional(),
  createdAt: numberMetaQuerySchema.optional(),
  updatedAt: numberMetaQuerySchema.optional(),
  createdBy: stringMetaQuerySchema.optional(),
  updatedBy: stringMetaQuerySchema.optional(),
  meta: objPartQueryListSchema.optional(),
});

export const updatePermissionsSchema = z.object({
  query: permissionQuerySchema,
  update: z.object({
    entity: entitySchema.optional(),
    action: actionSchema.optional(),
    target: targetSchema.optional(),
    description: z.string().optional(),
    meta: z.record(z.string(), z.string()).optional().or(z.null()),
  }),
  updateMany: z.boolean().optional(),
});

export const deletePermissionsSchema = z.object({
  query: permissionQuerySchema,
  deleteMany: z.boolean().optional(),
});

export const getPermissionsSchema = z.object({
  query: permissionQuerySchema,
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: objSortListSchema.optional(),
});

export const checkPermissionItemSchema = z.object({
  entity: entitySchema,
  action: actionSchema,
  target: targetSchema,
});

export const checkPermissionsSchema = z.object({
  appId: z.string(),
  items: z.array(checkPermissionItemSchema),
});

export type AddPermissionsEndpointArgs = z.infer<typeof addPermissionsSchema>;
export type UpdatePermissionsEndpointArgs = z.infer<
  typeof updatePermissionsSchema
>;
export type DeletePermissionsEndpointArgs = z.infer<
  typeof deletePermissionsSchema
>;
export type GetPermissionsEndpointArgs = z.infer<typeof getPermissionsSchema>;
export type CheckPermissionsEndpointArgs = z.infer<
  typeof checkPermissionsSchema
>;

export interface GetPermissionsEndpointResponse {
  permissions: IPermission[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CheckPermissionsEndpointResponse {
  results: {
    hasPermission: boolean;
  }[];
}
