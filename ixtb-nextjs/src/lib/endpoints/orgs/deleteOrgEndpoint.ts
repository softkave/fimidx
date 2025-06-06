import { getGroupSchema, kPermissions } from "fmdx-core/definitions/index";
import { deleteGroup } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteGroupEndpoint: NextUserAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getGroupSchema.parse(await req.json());

  await checkPermission({
    userId,
    groupId: input.id,
    permission: kPermissions.group.delete,
  });

  await deleteGroup({ id: input.id });
};
