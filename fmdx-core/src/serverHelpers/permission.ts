import assert from "assert";
import { OwnServerError } from "../common/error.js";
import type { IMember } from "../definitions/members.js";
import { kPermissions } from "../definitions/permissions.js";
import { getMember } from "./member/getMember.js";

export async function hasPermission(params: {
  userId: string;
  orgId: string;
  member?: IMember;
  permission: string | string[];
  op?: "any" | "all";
}) {
  const { userId, orgId, member: inputMember, permission, op = "all" } = params;

  const member = inputMember ?? (await getMember({ userId, orgId }));
  const { permissions } = member;

  if (!permissions) {
    return false;
  }

  const hasWildcard = permissions.includes(kPermissions.wildcard);
  if (hasWildcard) {
    return true;
  }

  if (Array.isArray(permission)) {
    if (op === "any") {
      return permission.some((p) => permissions.includes(p));
    }

    return permission.every((p) => permissions.includes(p));
  }

  return permissions.includes(permission);
}

export async function checkPermission(params: {
  userId: string;
  orgId: string;
  member?: IMember;
  permission: string | string[];
  op?: "any" | "all";
}) {
  const userHasPermission = await hasPermission(params);
  assert(userHasPermission, new OwnServerError("Access Denied", 403));
}
