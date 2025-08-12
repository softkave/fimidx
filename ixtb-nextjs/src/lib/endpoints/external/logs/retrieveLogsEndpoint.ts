import {
  GetLogsEndpointResponse,
  getLogsSchema,
} from "fimidx-core/definitions/log";
import { getLogs } from "fimidx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const retrieveLogsEndpoint: NextMaybeAuthenticatedEndpointFn<
  GetLogsEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getLogsSchema.parse(await req.json());
  const { logs, page, limit, hasMore } = await getLogs({
    args: input,
  });

  const response: GetLogsEndpointResponse = {
    logs,
    page,
    limit,
    hasMore,
  };

  return response;
};
