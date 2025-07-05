import assert from "assert";
import { first } from "lodash-es";
import { kOwnServerErrorCodes, OwnServerError } from "../../common/error.js";
import type { UpdateMemberPermissionsEndpointArgs } from "../../definitions/member.js";
import type { IObjStorage } from "../../storage/types.js";
import { addMemberPermissions } from "./addMemberPermissions.js";
import { getMembers } from "./getMembers.js";

export async function updateMemberPermissions(params: {
  args: UpdateMemberPermissionsEndpointArgs;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, by, byType, storage } = params;
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
    storage,
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
    storage,
  });

  member.permissions = newPermissions;

  return {
    member,
  };
}
