import {
  getOrgSchema,
  kPermissions,
  UpdateOrgEndpointResponse,
  updateOrgSchema,
} from "fmdx-core/definitions/index";
import { updateOrg } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateOrgEndpoint: NextUserAuthenticatedEndpointFn<
  UpdateOrgEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as { orgId: string };
  const orgUpdateInput = updateOrgSchema.parse(await req.json());
  const orgInput = getOrgSchema.parse({
    id: pathParams.orgId,
  });

  await checkPermission({
    userId,
    orgId: orgInput.id,
    permission: kPermissions.org.update,
  });

  const updatedOrg = await updateOrg({
    id: orgInput.id,
    args: orgUpdateInput,
    userId,
  });

  const response: UpdateOrgEndpointResponse = {
    org: updatedOrg,
  };

  return response;
};
