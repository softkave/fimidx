import { getMemberByIdSchema } from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { deleteMemberById, getMember } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteMemberEndpoint: NextUserAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getMemberByIdSchema.parse(await req.json());

  const member = await getMember({ id: input.id });
  await checkPermission({
    userId,
    orgId: member.orgId,
    permission: kPermissions.member.remove,
  });

  await deleteMemberById({ id: input.id });
};
