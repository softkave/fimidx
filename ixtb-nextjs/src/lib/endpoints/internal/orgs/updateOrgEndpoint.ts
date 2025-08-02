import {
  UpdateOrgEndpointResponse,
  updateOrgSchema,
} from "@/src/definitions/org";
import { kId0 } from "fimidx-core/definitions/index";
import { updateGroups } from "fimidx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../../types";

export const updateOrgEndpoint: NextUserAuthenticatedEndpointFn<
  UpdateOrgEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;

  const pathParams = (await ctx.params) as { orgId: string };
  const input = updateOrgSchema.parse({
    id: pathParams.orgId,
    update: await req.json(),
  });

  await updateGroups({
    args: {
      query: {
        id: {
          eq: input.id,
        },
        appId: kId0,
      },
      update: input.update,
      updateMany: false,
    },
    by: userId,
    byType: kId0,
  });

  const response: UpdateOrgEndpointResponse = {
    success: true,
  };

  return response;
};
