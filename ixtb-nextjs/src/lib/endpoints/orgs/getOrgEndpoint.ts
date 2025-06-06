import {
  GetGroupEndpointResponse,
  getGroupSchema,
} from "fmdx-core/definitions/index";
import { getGroup, hasMemberInvitation } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getGroupEndpoint: NextUserAuthenticatedEndpointFn<
  GetGroupEndpointResponse
> = async (params) => {
  const {
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as { groupId: string };
  const input = getGroupSchema.parse({
    id: pathParams.groupId,
  });

  await hasMemberInvitation({ userId, groupId: input.id });

  const group = await getGroup({ id: input.id });
  const response: GetGroupEndpointResponse = {
    group,
  };

  return response;
};
