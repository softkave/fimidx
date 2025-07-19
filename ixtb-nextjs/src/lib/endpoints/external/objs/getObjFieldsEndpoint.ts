import {
  getObjFieldsSchema,
  IGetObjFieldsEndpointResponse,
  kObjTags,
} from "fmdx-core/definitions/obj";
import { getObjFields } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

// TODO: delineate between internal and external objs

export const getObjFieldsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetObjFieldsEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getObjFieldsSchema.parse(await req.json());
  const response = await getObjFields({
    appId: input.appId,
    page: input.page,
    limit: input.limit,
    tag: kObjTags.obj,
  });

  return response;
};
