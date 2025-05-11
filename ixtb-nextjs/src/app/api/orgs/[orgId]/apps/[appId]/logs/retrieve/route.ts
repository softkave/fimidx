import { GetLogsEndpointResponse, getLogsSchema } from "@/src/definitions/log";
import { kPermissions } from "@/src/definitions/permissions";
import { getLogs } from "@/src/lib/serverHelpers/logs/getLogs";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; appId: string };
  const input = getLogsSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.log.read,
  });
  const { logs, page, limit, total, hasMore } = await getLogs({
    args: input,
    appId: params.appId,
    orgId: params.orgId,
  });

  const response: GetLogsEndpointResponse = {
    logs,
    page,
    limit,
    total,
    hasMore,
  };

  // winstonLogger.info("Retrieved logs", {
  //   params,
  //   input,
  //   response,
  // });

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
