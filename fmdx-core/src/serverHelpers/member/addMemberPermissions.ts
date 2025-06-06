import { isString } from "lodash-es";
import type {
  IPermission,
  IPermissionAction,
  IPermissionAtom,
  IPermissionEntity,
  IPermissionTarget,
} from "../../definitions/permission.js";
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
    meta: {
      __fmdx_managed_memberId: memberId,
      __fmdx_managed_groupId: groupId,
    },
  };
}

export async function addMemberPermissions(params: {
  by: string;
  byType: string;
  groupId: string;
  appId: string;
  permissions: IPermissionAtom[];
  memberId: string;
}) {
  const { by, byType, groupId, appId, permissions, memberId } = params;
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
  });

  return {
    permissions: newPermissions,
  };
}
