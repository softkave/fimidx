import { deleteAuthItemSchema } from "fmdx-core/definitions/webSockets";
import {
  deleteAuthItem,
  verifyClientTokenAuthIdAccess,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const deleteAuthItemEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteAuthItemSchema.parse(await req.json());

  await verifyClientTokenAuthIdAccess({
    input,
    clientToken,
  });

  await deleteAuthItem(input);
};
