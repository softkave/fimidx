import assert from "assert";
import { first } from "lodash-es";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type { UpdateMemberPermissionsEndpointArgs } from "../../definitions/member.js";
import { addMemberPermissions } from "./addMemberPermissions.js";
import { getMembers } from "./getMembers.js";

export async function updateMemberPermissions(params: {
  args: UpdateMemberPermissionsEndpointArgs;
  by: string;
  byType: string;
}) {
  const { args, by, byType } = params;
  const { query, update } = args;

  const { members } = await getMembers({
    args: {
      query: {
        appId: query.appId,
        groupId: query.groupId,
        memberId: {
          eq: query.memberId,
        },
      },
    },
    includePermissions: true,
  });

  const member = first(members);
  assert(
    member,
    new OwnServerError(
      "Member not found",
      kOwnServerErrorCodes.InternalServerError
    )
  );

  const { permissions: newPermissions } = await addMemberPermissions({
    by,
    byType,
    groupId: member.groupId,
    appId: member.appId,
    permissions: update.permissions,
    memberId: member.memberId,
  });

  member.permissions = newPermissions;

  return {
    member,
  };
}
