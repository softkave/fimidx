import {
  IUpdateMonitorEndpointResponse,
  kPermissions,
  updateMonitorSchema,
} from "fmdx-core/definitions/index";
import {
  checkPermission,
  getMonitor,
  updateMonitor,
} from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateMonitorEndpoint: NextUserAuthenticatedEndpointFn<
  IUpdateMonitorEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    monitorId: string;
  };
  const monitorUpdateInput = updateMonitorSchema.parse({
    ...(await req.json()),
    id: pathParams.monitorId,
  });

  const monitor = await getMonitor({ id: monitorUpdateInput.id });
  await checkPermission({
    userId,
    groupId: monitor.groupId,
    permission: kPermissions.monitor.update,
  });

  const updatedMonitor = await updateMonitor({
    args: monitorUpdateInput,
    userId,
    existingMonitor: monitor,
  });

  const response: IUpdateMonitorEndpointResponse = {
    monitor: updatedMonitor,
  };

  return response;
};
