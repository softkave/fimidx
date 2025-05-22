import {
  AddClientTokenEndpointResponse,
  addClientTokenSchema,
} from "fmdx-core/definitions/clientToken";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { addClientToken, getApp } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const addClientTokenEndpoint: NextUserAuthenticatedEndpointFn<
  AddClientTokenEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = addClientTokenSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.clientToken.update,
  });

  const clientToken = await addClientToken({
    args: input,
    userId,
    orgId: app.orgId,
    appId: app.id,
  });

  const response: AddClientTokenEndpointResponse = {
    clientToken,
  };

  return response;
};
