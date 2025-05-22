import { disconnectWebSocketSchema } from "fmdx-core/definitions/index";
import {
  deleteConnectedWebSocket,
  verifyClientTokenAuthIdAccess,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const disconnectWebSocketEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = disconnectWebSocketSchema.parse(await req.json());

  await verifyClientTokenAuthIdAccess({
    input,
    clientToken,
  });

  await deleteConnectedWebSocket(input);
};
