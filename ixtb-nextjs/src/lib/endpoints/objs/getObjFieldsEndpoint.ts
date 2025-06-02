import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import {
  getObjFieldsSchema,
  IGetObjFieldsEndpointResponse,
  kObjTags,
} from "fmdx-core/definitions/obj";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  checkPermission,
  getApp,
  getObjFields,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getObjFieldsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetObjFieldsEndpointResponse
> = async (params) => {
  const { req, session } = params;
  const input = getObjFieldsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  if (session.clientToken) {
    assert(
      app.id === session.clientToken.appId,
      new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
    );
  } else if (session.userId) {
    await checkPermission({
      userId: session.userId,
      orgId: app.orgId,
      permission: kPermissions.obj.read,
    });
  } else {
    assert(
      false,
      new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
    );
  }

  const response = await getObjFields({
    appId: input.appId,
    page: input.page,
    limit: input.limit,
    tag: kObjTags.obj,
  });

  return {
    fields: response.fields,
    page: response.page,
    limit: response.limit,
    hasMore: response.hasMore,
  };
};
