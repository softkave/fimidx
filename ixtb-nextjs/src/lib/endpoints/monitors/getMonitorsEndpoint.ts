import {
  getMonitorsSchema,
  IGetMonitorsEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getApp, getMonitorList } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getMonitorsEndpoint: NextUserAuthenticatedEndpointFn<
  IGetMonitorsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getMonitorsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.monitor.read,
  });

  const { monitors, total } = await getMonitorList({
    args: input,
    orgId: app.orgId,
    appId: input.appId,
  });

  const response: IGetMonitorsEndpointResponse = {
    monitors,
    total,
  };

  return response;
};
