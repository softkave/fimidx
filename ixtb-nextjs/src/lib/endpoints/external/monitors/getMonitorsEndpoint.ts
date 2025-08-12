import {
  getMonitorsSchema,
  IGetMonitorsEndpointResponse,
} from "fimidx-core/definitions/index";
import { getMonitors } from "fimidx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const getMonitorsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetMonitorsEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getMonitorsSchema.parse(await req.json());
  const { monitors, page, limit, hasMore } = await getMonitors({
    args: input,
  });

  const response: IGetMonitorsEndpointResponse = {
    monitors,
    page,
    limit,
    hasMore,
  };

  return response;
};
