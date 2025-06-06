import {
  IGetAppWebSocketConfigurationEndpointResponse,
  getAppWebSocketConfigurationSchema,
} from "fmdx-core/definitions/configurations";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  getApp,
  tryGetAppWebSocketConfiguration,
} from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getAppWebSocketConfigurationEndpoint: NextUserAuthenticatedEndpointFn<
  IGetAppWebSocketConfigurationEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getAppWebSocketConfigurationSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    groupId: app.groupId,
    permission: kPermissions.app.read,
  });

  const appWebSocketConfiguration = await tryGetAppWebSocketConfiguration({
    args: {
      appId: app.id,
    },
  });

  const response: IGetAppWebSocketConfigurationEndpointResponse = {
    appWebSocketConfiguration,
  };

  return response;
};
