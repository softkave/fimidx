import {
  IGetMemberEndpointResponse,
  getMemberByIdSchema,
} from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { augmentMembers, getMember } from "fmdx-core/serverHelpers/index";
import {
  checkPermission,
  hasPermission,
} from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getMemberEndpoint: NextUserAuthenticatedEndpointFn<
  IGetMemberEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getMemberByIdSchema.parse(await req.json());

  const member = await getMember({ id: input.id });
  await checkPermission({
    userId,
    groupId: member.groupId,
    permission: kPermissions.member.read,
  });

  const [augmentedMember] = await augmentMembers(
    [member],
    await hasPermission({
      userId,
      groupId: member.groupId,
      permission: kPermissions.member.readPermissions,
    })
  );
  const response: IGetMemberEndpointResponse = {
    member: augmentedMember,
  };

  return response;
};
