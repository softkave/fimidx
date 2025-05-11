import {
  GetLogByIdEndpointResponse,
  getLogByIdSchema,
} from "@/src/definitions/log";
import { kPermissions } from "@/src/definitions/permissions";
import { getLog } from "@/src/lib/serverHelpers/logs/getLog";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
    logId: string;
  };
  const input = getLogByIdSchema.parse({
    id: params.logId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.log.read,
  });

  const log = await getLog({
    id: input.id,
    orgId: params.orgId,
    appId: params.appId,
  });
  const response: GetLogByIdEndpointResponse = {
    log,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
