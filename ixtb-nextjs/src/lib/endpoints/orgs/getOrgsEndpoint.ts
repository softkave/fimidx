import {
  GetGroupsEndpointResponse,
  getGroupsSchema,
} from "fmdx-core/definitions/index";
import { getGroupList } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getGroupsEndpoint: NextUserAuthenticatedEndpointFn<
  GetGroupsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getGroupsSchema.parse(await req.nextUrl.searchParams);
  const { groups, total } = await getGroupList({ args: input, userId });
  const response: GetGroupsEndpointResponse = {
    groups,
    total,
  };

  return response;
};
