import {
  getManyObjsSchema,
  IGetManyObjsEndpointResponse,
  kObjTags,
} from "fmdx-core/definitions/obj";
import { getManyObjs } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const getManyObjsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetManyObjsEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getManyObjsSchema.parse(await req.json());
  const response = await getManyObjs({
    objQuery: input.query,
    tag: kObjTags.obj,
    limit: input.limit,
    page: input.page,
    sort: input.sort,
  });

  return response;
};
