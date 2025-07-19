import {
  IUpdateManyObjsEndpointResponse,
  kObjTags,
  updateManyObjsSchema,
} from "fmdx-core/definitions/obj";
import { kByTypes } from "fmdx-core/definitions/other";
import { updateManyObjs } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const updateManyObjsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IUpdateManyObjsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = updateManyObjsSchema.parse(await req.json());
  await updateManyObjs({
    by: clientToken.id,
    byType: kByTypes.clientToken,
    tag: kObjTags.obj,
    objQuery: input.query,
    update: input.update,
    updateWay: input.updateWay,
    fieldsToIndex: input.fieldsToIndex,
    shouldIndex: input.shouldIndex,
    count: input.count,
  });

  return {
    success: true,
  };
};
