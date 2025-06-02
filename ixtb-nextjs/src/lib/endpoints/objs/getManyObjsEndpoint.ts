import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import {
  getManyObjsSchema,
  IGetManyObjsEndpointResponse,
  kObjTags,
} from "fmdx-core/definitions/obj";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  checkPermission,
  getApp,
  getManyObjs,
} from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getManyObjsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetManyObjsEndpointResponse
> = async (params) => {
  const { req, session } = params;
  const input = getManyObjsSchema.parse(await req.json());

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

  const response = await getManyObjs({
    objQuery: input,
    tag: kObjTags.obj,
    includeCount: true,
    limit: input.limit,
    page: input.page,
    sort: input.sort,
  });

  return {
    objs: response.objs,
    page: response.page,
    limit: response.limit,
    hasMore: response.hasMore,
  };
};
