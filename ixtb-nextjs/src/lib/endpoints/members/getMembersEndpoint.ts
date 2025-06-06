import {
  IGetMembersEndpointResponse,
  getMembersSchema,
} from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  augmentMembers,
  getGroupMemberList,
} from "fmdx-core/serverHelpers/index";
import {
  checkPermission,
  hasPermission,
} from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getMembersEndpoint: NextUserAuthenticatedEndpointFn<
  IGetMembersEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getMembersSchema.parse(await req.json());

  await checkPermission({
    userId,
    groupId: input.groupId,
    permission: kPermissions.member.read,
  });

  const { members, total } = await getGroupMemberList({
    args: input,
    groupId: input.groupId,
  });

  const augmentedMembers = await augmentMembers(
    members,
    await hasPermission({
      userId,
      groupId: input.groupId,
      permission: kPermissions.member.readPermissions,
    })
  );

  const response: IGetMembersEndpointResponse = {
    members: augmentedMembers,
    total,
  };

  return response;
};
