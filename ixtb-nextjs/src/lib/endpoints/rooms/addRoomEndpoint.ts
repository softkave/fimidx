import assert from "assert";
import { OwnServerError } from "fmdx-core/common/error";
import {
  addRoomSchema,
  IAddRoomEndpointResponse,
} from "fmdx-core/definitions/index";
import { addRoom } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const addRoomEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddRoomEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = addRoomSchema.parse(await req.json());

  assert(
    clientToken.appId === input.appId,
    new OwnServerError("Unauthorized", 403)
  );
  const room = await addRoom({
    args: input,
    clientTokenId: clientToken.id,
    orgId: clientToken.orgId,
  });

  const response: IAddRoomEndpointResponse = {
    room,
  };

  return response;
};
