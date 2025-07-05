import { isString } from "lodash-es";
import type { IMemberObjRecordMeta } from "../../definitions/member.js";
import type {
  IPermission,
  IPermissionAction,
  IPermissionAtom,
  IPermissionEntity,
  IPermissionTarget,
} from "../../definitions/permission.js";
import type { IObjStorage } from "../../storage/types.js";
import { addPermissions } from "../permission/addPermissions.js";

export function getFmdxManagedMemberPermissionEntity(params: {
  entity: IPermissionEntity;
  memberId: string;
}) {
  const { entity, memberId } = params;
  return isString(entity)
    ? `__fmdx_managed_permission_entity_${entity}:${memberId}`
    : {
        ...entity,
        __fmdx_managed_permission_entity_memberId: memberId,
      };
}

export function getFmdxManagedMemberPermissionAction(params: {
  action: IPermissionAction;
  memberId: string;
}) {
  const { action, memberId } = params;
  return isString(action)
    ? `__fmdx_managed_permission_action_${action}:${memberId}`
    : {
        ...action,
        __fmdx_managed_permission_action_memberId: memberId,
      };
}

export function getFmdxManagedMemberPermissionTarget(params: {
  target: IPermissionTarget;
  memberId: string;
}) {
  const { target, memberId } = params;
  return isString(target)
    ? `__fmdx_managed_permission_target_${target}:${memberId}`
    : {
        ...target,
        __fmdx_managed_permission_target_memberId: memberId,
      };
}

export function getFmdxManagedMemberPermission(params: {
  permission: IPermissionAtom;
  memberId: string;
  groupId: string;
}): IPermissionAtom & Pick<IPermission, "meta"> {
  const { permission, memberId, groupId } = params;
  const meta: IMemberObjRecordMeta = {
    __fmdx_managed_memberId: memberId,
    __fmdx_managed_groupId: groupId,
  };
  return {
    ...permission,
    entity: getFmdxManagedMemberPermissionEntity({
      entity: permission.entity,
      memberId,
    }),
    action: getFmdxManagedMemberPermissionAction({
      action: permission.action,
      memberId,
    }),
    target: getFmdxManagedMemberPermissionTarget({
      target: permission.target,
      memberId,
    }),
    meta,
  };
}

// Inverse functions to transform managed permissions back to original format
export function getOriginalMemberPermissionEntity(params: {
  entity: IPermissionEntity;
  memberId: string;
}): IPermissionEntity {
  const { entity, memberId } = params;
  if (isString(entity)) {
    const prefix = `__fmdx_managed_permission_entity_`;
    const suffix = `:${memberId}`;
    if (entity.startsWith(prefix) && entity.endsWith(suffix)) {
      return entity.slice(prefix.length, -suffix.length);
    }
  } else {
    // Handle object format
    const { __fmdx_managed_permission_entity_memberId, ...originalEntity } =
      entity;
    return originalEntity;
  }
  return entity;
}

export function getOriginalMemberPermissionAction(params: {
  action: IPermissionAction;
  memberId: string;
}): IPermissionAction {
  const { action, memberId } = params;
  if (isString(action)) {
    const prefix = `__fmdx_managed_permission_action_`;
    const suffix = `:${memberId}`;
    if (action.startsWith(prefix) && action.endsWith(suffix)) {
      return action.slice(prefix.length, -suffix.length);
    }
  } else {
    // Handle object format
    const { __fmdx_managed_permission_action_memberId, ...originalAction } =
      action;
    return originalAction;
  }
  return action;
}

export function getOriginalMemberPermissionTarget(params: {
  target: IPermissionTarget;
  memberId: string;
}): IPermissionTarget {
  const { target, memberId } = params;
  if (isString(target)) {
    const prefix = `__fmdx_managed_permission_target_`;
    const suffix = `:${memberId}`;
    if (target.startsWith(prefix) && target.endsWith(suffix)) {
      return target.slice(prefix.length, -suffix.length);
    }
  } else {
    // Handle object format
    const { __fmdx_managed_permission_target_memberId, ...originalTarget } =
      target;
    return originalTarget;
  }
  return target;
}

export function getOriginalMemberPermission(params: {
  permission: IPermission;
  memberId: string;
}): IPermissionAtom {
  const { permission, memberId } = params;
  return {
    entity: getOriginalMemberPermissionEntity({
      entity: permission.entity,
      memberId,
    }),
    action: getOriginalMemberPermissionAction({
      action: permission.action,
      memberId,
    }),
    target: getOriginalMemberPermissionTarget({
      target: permission.target,
      memberId,
    }),
  };
}

export async function addMemberPermissions(params: {
  by: string;
  byType: string;
  groupId: string;
  appId: string;
  permissions: IPermissionAtom[];
  memberId: string;
  storage?: IObjStorage;
}) {
  const { by, byType, groupId, appId, permissions, memberId, storage } = params;
  const { permissions: newPermissions } = await addPermissions({
    by,
    byType,
    groupId,
    args: {
      appId,
      permissions: permissions.map((permission) =>
        getFmdxManagedMemberPermission({
          permission,
          memberId,
          groupId,
        })
      ),
    },
    storage,
  });

  return {
    permissions: newPermissions,
  };
}
