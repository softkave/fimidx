import {
  GetLogByIdEndpointResponse,
  getLogByIdSchema,
} from "fmdx-core/definitions/log";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getLog } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getLogEndpoint: NextUserAuthenticatedEndpointFn<
  GetLogByIdEndpointResponse
> = async (params) => {
  const {
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    logId: string;
  };
  const input = getLogByIdSchema.parse({
    id: pathParams.logId,
  });

  const log = await getLog({ id: input.id });
  await checkPermission({
    userId,
    orgId: log.orgId,
    permission: kPermissions.log.read,
  });

  const response: GetLogByIdEndpointResponse = {
    log,
  };

  return response;
};
