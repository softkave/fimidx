import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { kObjTags, updateManyObjsSchema } from "fmdx-core/definitions/obj";
import { kByTypes } from "fmdx-core/definitions/other";
import { getApp, updateManyObjs } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const updateManyObjsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = updateManyObjsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  assert(
    app.id === clientToken.appId,
    new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
  );

  const response = await updateManyObjs({
    by: clientToken.id,
    byType: kByTypes.clientToken,
    tag: kObjTags.obj,
    count: input.limit,
    objQuery: input,
    update: input.update,
    updateWay: input.updateWay,
  });

  return response;
};
