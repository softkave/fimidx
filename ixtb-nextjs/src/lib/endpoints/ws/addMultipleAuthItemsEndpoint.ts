import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  addMultipleAuthItemsSchema,
  IAddMultipleAuthItemsEndpointResponse,
} from "fmdx-core/definitions/index";
import {
  addMultipleAuthItems,
  getApp,
  getAuthId,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const addMultipleAuthItemsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddMultipleAuthItemsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = addMultipleAuthItemsSchema.parse(await req.json());

  const [authId, app] = await Promise.all([
    getAuthId(input),
    getApp({ id: input.appId }),
  ]);

  assert(
    authId.appId === clientToken.appId,
    new OwnServerError("Unauthorized", 403)
  );
  assert(app.id === clientToken.appId, new OwnServerError("Unauthorized", 403));

  const authItems = await addMultipleAuthItems({
    args: input,
    groupId: app.groupId,
    clientTokenId: clientToken.id,
  });

  const response: IAddMultipleAuthItemsEndpointResponse = {
    authItems,
  };

  return response;
};
