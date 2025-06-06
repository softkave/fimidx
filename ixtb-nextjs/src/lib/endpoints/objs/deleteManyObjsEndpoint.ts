import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { deleteManyObjsSchema, kObjTags } from "fmdx-core/definitions/obj";
import { kByTypes } from "fmdx-core/definitions/other";
import { deleteManyObjs, getApp } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const deleteManyObjsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteManyObjsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  assert(
    app.id === clientToken.appId,
    new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
  );

  await deleteManyObjs({
    deletedBy: clientToken.id,
    deletedByType: kByTypes.clientToken,
    objQuery: input,
    tag: kObjTags.obj,
    deleteMany: input.deleteMany ?? false,
  });
};
