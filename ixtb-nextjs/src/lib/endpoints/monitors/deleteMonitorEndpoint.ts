import { deleteMonitorSchema, kPermissions } from "fmdx-core/definitions/index";
import { deleteMonitor, getMonitor } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteMonitorEndpoint: NextUserAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = deleteMonitorSchema.parse(await req.json());

  const monitor = await getMonitor({ id: input.id });
  await checkPermission({
    userId,
    orgId: monitor.orgId,
    permission: kPermissions.monitor.delete,
  });

  await deleteMonitor({ id: monitor.id });
};
