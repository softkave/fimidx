import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  addAuthIdSchema,
  IAddAuthIdEndpointResponse,
} from "fmdx-core/definitions/index";
import { addAuthId, getApp } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const addAuthIdEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddAuthIdEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = addAuthIdSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  assert(app.id === clientToken.appId, new OwnServerError("Unauthorized", 403));

  const authId = await addAuthId({
    args: input,
    orgId: app.orgId,
    clientTokenId: clientToken.id,
  });

  const response: IAddAuthIdEndpointResponse = {
    authId,
  };

  return response;
};
