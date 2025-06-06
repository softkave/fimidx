import {
  IAddAppWebSocketConfigurationEndpointResponse,
  addAppWebSocketConfigurationSchema,
} from "fmdx-core/definitions/configurations";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  addAppWebSocketConfiguration,
  getApp,
} from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateAppWebSocketConfigurationEndpoint: NextUserAuthenticatedEndpointFn<
  IAddAppWebSocketConfigurationEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = addAppWebSocketConfigurationSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    groupId: app.groupId,
    permission: kPermissions.app.update,
  });

  const appWebSocketConfiguration = await addAppWebSocketConfiguration({
    args: input,
    userId,
    groupId: app.groupId,
  });

  const response: IAddAppWebSocketConfigurationEndpointResponse = {
    appWebSocketConfiguration,
  };

  return response;
};
