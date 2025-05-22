import { getOrgSchema, kPermissions } from "fmdx-core/definitions/index";
import { deleteOrg } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteOrgEndpoint: NextUserAuthenticatedEndpointFn<void> = async (
  params
) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getOrgSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: input.id,
    permission: kPermissions.org.delete,
  });

  await deleteOrg({ id: input.id });
};
