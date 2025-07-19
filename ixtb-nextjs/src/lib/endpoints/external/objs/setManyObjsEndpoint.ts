import { getApp } from "@/src/lib/serverHelpers/app/getApp";
import {
  ISetManyObjsEndpointResponse,
  kObjTags,
  setManyObjsSchema,
} from "fmdx-core/definitions/obj";
import { kByTypes } from "fmdx-core/definitions/other";
import { setManyObjs } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const setManyObjsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  ISetManyObjsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = setManyObjsSchema.parse(await req.json());
  const { app } = await getApp({
    input: { appId: input.appId },
    clientToken,
  });
  const response = await setManyObjs({
    by: clientToken.id,
    byType: kByTypes.clientToken,
    groupId: app.orgId,
    tag: kObjTags.obj,
    input,
  });

  return response;
};
