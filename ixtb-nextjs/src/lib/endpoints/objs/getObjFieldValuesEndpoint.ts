import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import {
  getObjFieldValuesSchema,
  IGetObjFieldValuesEndpointResponse,
  kObjTags,
} from "fmdx-core/definitions/obj";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  checkPermission,
  getApp,
  getObjFieldValues,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getObjFieldValuesEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetObjFieldValuesEndpointResponse
> = async (params) => {
  const { req, session } = params;
  const input = getObjFieldValuesSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  if (session.clientToken) {
    assert(
      app.id === session.clientToken.appId,
      new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
    );
  } else if (session.userId) {
    await checkPermission({
      userId: session.userId,
      groupId: app.groupId,
      permission: kPermissions.obj.read,
    });
  } else {
    assert(
      false,
      new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
    );
  }

  const response = await getObjFieldValues({
    appId: input.appId,
    field: input.field,
    page: input.page,
    limit: input.limit,
    tag: kObjTags.obj,
  });

  return {
    values: response.values,
    page: response.page,
    limit: response.limit,
    hasMore: response.hasMore,
  };
};
