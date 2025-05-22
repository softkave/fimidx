import { deleteAuthIdSchema } from "fmdx-core/definitions/index";
import {
  deleteAuthId,
  verifyClientTokenAuthIdAccess,
} from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const deleteAuthIdEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteAuthIdSchema.parse(await req.json());

  await verifyClientTokenAuthIdAccess({
    input,
    clientToken,
  });

  await deleteAuthId(input);
};
