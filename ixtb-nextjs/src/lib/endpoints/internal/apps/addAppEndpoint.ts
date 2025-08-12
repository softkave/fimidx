import { addAppSchema } from "fimidx-core/definitions/app";
import {
  AddAppEndpointResponse,
  kByTypes,
} from "fimidx-core/definitions/index";
import { addApp } from "fimidx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../../types";

export const addAppEndpoint: NextUserAuthenticatedEndpointFn<
  AddAppEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;

  const input = addAppSchema.parse(await req.json());
  const { app } = await addApp({
    args: input,
    by: userId,
    byType: kByTypes.user,
  });

  const response: AddAppEndpointResponse = {
    app,
  };

  return response;
};
