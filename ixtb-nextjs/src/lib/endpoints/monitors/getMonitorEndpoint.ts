import {
  getMonitorByIdSchema,
  IGetMonitorByIdEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getMonitor } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getMonitorEndpoint: NextUserAuthenticatedEndpointFn<
  IGetMonitorByIdEndpointResponse
> = async (params) => {
  const {
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    monitorId: string;
  };
  const input = getMonitorByIdSchema.parse({
    id: pathParams.monitorId,
  });

  const monitor = await getMonitor({ id: input.id });
  await checkPermission({
    userId,
    groupId: monitor.groupId,
    permission: kPermissions.monitor.read,
  });

  const response: IGetMonitorByIdEndpointResponse = {
    monitor,
  };

  return response;
};
