import {
  GetLogsEndpointResponse,
  getLogsSchema,
} from "fmdx-core/definitions/log";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getApp, getLogs } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const retrieveLogsEndpoint: NextUserAuthenticatedEndpointFn<
  GetLogsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getLogsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.log.read,
  });
  const { logs, page, limit, total, hasMore } = await getLogs({
    args: input,
    appId: app.id,
    orgId: app.orgId,
  });

  const response: GetLogsEndpointResponse = {
    logs,
    page,
    limit,
    total,
    hasMore,
  };

  return response;
};
