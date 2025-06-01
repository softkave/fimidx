import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import {
  ISetManyObjsEndpointResponse,
  kObjTags,
  setManyObjsSchema,
} from "fmdx-core/definitions/obj";
import { getApp, setManyObjs } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";
import { kByTypes } from "fmdx-core/definitions/other";

export const setManyObjsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  ISetManyObjsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = setManyObjsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  assert(
    app.id === clientToken.appId,
    new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
  );

  const response = await setManyObjs({
    by: clientToken.id,
    byType: kByTypes.clientToken,
    orgId: app.orgId,
    tag: kObjTags.obj,
    input,
  });

  return response;
};
