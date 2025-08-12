import {
  IUpdateMonitorsEndpointResponse,
  updateMonitorsSchema,
} from "fimidx-core/definitions/index";
import { updateMonitors } from "fimidx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const updateMonitorsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IUpdateMonitorsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { getBy },
  } = params;

  const input = updateMonitorsSchema.parse(await req.json());
  await updateMonitors({
    args: input,
    by: getBy().by,
    byType: getBy().byType,
  });

  const response: IUpdateMonitorsEndpointResponse = {
    success: true,
  };

  return response;
};
