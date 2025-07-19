import {
  GetAppsEndpointResponse,
  getAppsSchema,
} from "fmdx-core/definitions/index";
import { getApps } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../../types";

export const getAppsEndpoint: NextUserAuthenticatedEndpointFn<
  GetAppsEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getAppsSchema.parse(await req.json());
  const { apps, hasMore, page, limit } = await getApps({
    args: input,
  });

  const response: GetAppsEndpointResponse = {
    apps,
    page,
    limit,
    hasMore,
  };

  return response;
};
