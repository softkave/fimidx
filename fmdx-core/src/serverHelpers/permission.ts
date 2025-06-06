import assert from "assert";
import { first } from "lodash-es";
import { OwnServerError } from "../common/error.js";
import type { IMember } from "../definitions/member.js";
import { kFmdxPermissions } from "../definitions/permission.js";
import { getMembers } from "./member/getMembers.js";

export async function hasPermission(params: {
  memberId: string;
  appId: string;
  groupId: string;
  member?: IMember;
  permission: string | string[];
  op?: "any" | "all";
}) {
  const {
    memberId,
    appId,
    groupId,
    member: inputMember,
    permission,
    op = "all",
  } = params;

  const member =
    inputMember ??
    first(
      (
        await getMembers({
          args: {
            query: {
              appId,
              groupId,
              memberId: { eq: memberId },
            },
            limit: 1,
          },
        })
      ).members
    );
  assert(member, new OwnServerError("Member not found", 404));
  const { permissions } = member;

  if (!permissions) {
    return false;
  }

  const hasWildcard = permissions.includes(kFmdxPermissions.wildcard);
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
  memberId: string;
  appId: string;
  groupId: string;
  member?: IMember;
  permission: string | string[];
  op?: "any" | "all";
}) {
  const memberHasPermission = await hasPermission(params);
  assert(memberHasPermission, new OwnServerError("Access Denied", 403));
}
