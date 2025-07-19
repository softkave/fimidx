import { deleteManyObjsSchema, kObjTags } from "fmdx-core/definitions/obj";
import { kByTypes } from "fmdx-core/definitions/other";
import { deleteManyObjs } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const deleteManyObjsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = deleteManyObjsSchema.parse(await req.json());
  await deleteManyObjs({
    deletedBy: clientToken.id,
    deletedByType: kByTypes.clientToken,
    objQuery: input.query,
    tag: kObjTags.obj,
    deleteMany: input.deleteMany ?? false,
  });
};
