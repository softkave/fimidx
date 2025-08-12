import { updateAppsSchema } from "fimidx-core/definitions/app";
import {
  kByTypes,
  UpdateAppEndpointResponse,
} from "fimidx-core/definitions/index";
import { updateApps } from "fimidx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../../types";

export const updateAppEndpoint: NextUserAuthenticatedEndpointFn<
  UpdateAppEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;

  const input = updateAppsSchema.parse(await req.json());
  await updateApps({
    args: input,
    by: userId,
    byType: kByTypes.user,
  });

  const response: UpdateAppEndpointResponse = {
    success: true,
  };

  return response;
};
