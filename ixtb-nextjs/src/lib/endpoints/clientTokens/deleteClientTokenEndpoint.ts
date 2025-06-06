import { getClientTokenSchema } from "fmdx-core/definitions/clientToken";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  deleteClientToken,
  getClientToken,
} from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteClientTokenEndpoint: NextUserAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getClientTokenSchema.parse(await req.json());

  const clientToken = await getClientToken({ id: input.id });
  await checkPermission({
    userId,
    groupId: clientToken.groupId,
    permission: kPermissions.clientToken.delete,
  });

  await deleteClientToken({ id: input.id });
};
