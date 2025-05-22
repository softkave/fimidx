import {
  GetOrgsEndpointResponse,
  getOrgsSchema,
} from "fmdx-core/definitions/index";
import { getOrgList } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getOrgsEndpoint: NextUserAuthenticatedEndpointFn<
  GetOrgsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getOrgsSchema.parse(await req.nextUrl.searchParams);
  const { orgs, total } = await getOrgList({ args: input, userId });
  const response: GetOrgsEndpointResponse = {
    orgs,
    total,
  };

  return response;
};
