import {
  getCallbacksSchema,
  IGetCallbacksEndpointResponse,
} from "fmdx-core/definitions/index";
import { getCallbacks } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const getCallbacksEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetCallbacksEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getCallbacksSchema.parse(await req.json());
  const { callbacks, hasMore, page, limit } = await getCallbacks({
    args: input,
  });

  const response: IGetCallbacksEndpointResponse = {
    callbacks,
    hasMore,
    page,
    limit,
  };

  return response;
};
