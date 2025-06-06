import {
  createMonitorSchema,
  ICreateMonitorEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { addMonitor, getApp } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const addMonitorEndpoint: NextUserAuthenticatedEndpointFn<
  ICreateMonitorEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = createMonitorSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    groupId: app.groupId,
    permission: kPermissions.monitor.update,
  });

  const monitor = await addMonitor({
    args: input,
    userId,
    groupId: app.groupId,
    appId: input.appId,
  });

  const response: ICreateMonitorEndpointResponse = {
    monitor,
  };

  return response;
};
