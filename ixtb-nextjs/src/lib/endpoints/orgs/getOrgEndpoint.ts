import {
  GetOrgEndpointResponse,
  getOrgSchema,
} from "fmdx-core/definitions/index";
import { getOrg, hasMemberInvitation } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getOrgEndpoint: NextUserAuthenticatedEndpointFn<
  GetOrgEndpointResponse
> = async (params) => {
  const {
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as { orgId: string };
  const input = getOrgSchema.parse({
    id: pathParams.orgId,
  });

  await hasMemberInvitation({ userId, orgId: input.id });

  const org = await getOrg({ id: input.id });
  const response: GetOrgEndpointResponse = {
    org,
  };

  return response;
};
