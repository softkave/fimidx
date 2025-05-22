import {
  IGetMembersEndpointResponse,
  getMembersSchema,
} from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  augmentMembers,
  getOrgMemberList,
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
    orgId: input.orgId,
    permission: kPermissions.member.read,
  });

  const { members, total } = await getOrgMemberList({
    args: input,
    orgId: input.orgId,
  });

  const augmentedMembers = await augmentMembers(
    members,
    await hasPermission({
      userId,
      orgId: input.orgId,
      permission: kPermissions.member.readPermissions,
    })
  );

  const response: IGetMembersEndpointResponse = {
    members: augmentedMembers,
    total,
  };

  return response;
};
