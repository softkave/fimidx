import {
  IUpdateMemberEndpointResponse,
  updateMemberSchema,
} from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  augmentMembers,
  getMember,
  updateMemberById,
} from "fmdx-core/serverHelpers/index";
import {
  checkPermission,
  hasPermission,
} from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateMemberEndpoint: NextUserAuthenticatedEndpointFn<
  IUpdateMemberEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const memberUpdateInput = updateMemberSchema.parse(await req.json());

  const member = await getMember({ id: memberUpdateInput.id });
  await checkPermission({
    userId,
    orgId: member.orgId,
    permission: kPermissions.member.update,
  });

  const updatedMember = await updateMemberById({
    args: memberUpdateInput,
    updatedBy: userId,
    existingMember: member,
  });

  const [augmentedMember] = await augmentMembers(
    [updatedMember],
    await hasPermission({
      userId,
      orgId: member.orgId,
      permission: kPermissions.member.readPermissions,
    })
  );
  const response: IUpdateMemberEndpointResponse = {
    member: augmentedMember,
  };

  return response;
};
