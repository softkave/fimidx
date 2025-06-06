import {
  UpdateClientTokenEndpointResponse,
  updateClientTokenSchema,
} from "fmdx-core/definitions/clientToken";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  getClientToken,
  updateClientToken,
} from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateClientTokenEndpoint: NextUserAuthenticatedEndpointFn<
  UpdateClientTokenEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    clientTokenId: string;
  };
  const clientTokenUpdateInput = updateClientTokenSchema.parse({
    ...(await req.json()),
    id: pathParams.clientTokenId,
  });

  const clientToken = await getClientToken({ id: clientTokenUpdateInput.id });
  await checkPermission({
    userId,
    groupId: clientToken.groupId,
    permission: kPermissions.clientToken.update,
  });

  const updatedClientToken = await updateClientToken({
    id: clientTokenUpdateInput.id,
    args: clientTokenUpdateInput,
    userId,
    existingClientToken: clientToken,
  });

  const response: UpdateClientTokenEndpointResponse = {
    clientToken: updatedClientToken,
  };

  return response;
};
