import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  getRoomsSchema,
  IGetRoomsEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getApp, getRoomList } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextMaybeAuthenticatedEndpointFn } from "../types";

export const getRoomsEndpoint: NextMaybeAuthenticatedEndpointFn<
  IGetRoomsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId, clientToken },
  } = params;
  const input = getRoomsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });

  if (userId) {
    await checkPermission({
      userId,
      groupId: app.groupId,
      permission: kPermissions.ws.read,
    });
  } else if (clientToken) {
    assert(
      app.id === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
  } else {
    throw new OwnServerError("Unauthorized", 403);
  }

  const { rooms, total } = await getRoomList({
    appId: input.appId,
    page: input.page,
    limit: input.limit,
  });

  const response: IGetRoomsEndpointResponse = {
    rooms,
    total,
  };

  return response;
};
