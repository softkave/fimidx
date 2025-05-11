import { addLogsSchema } from "@/src/definitions/log";
import { addLogs } from "@/src/lib/serverHelpers/logs/addLogs";
import { wrapClientTokenAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, { clientToken, checkOrgId }) => {
    const params = (await ctx.params) as { orgId: string; appId: string };
    const input = addLogsSchema.parse(await req.json());
    checkOrgId(params.orgId);

    await addLogs({
      appId: params.appId,
      inputLogs: input.logs,
      orgId: params.orgId,
      clientTokenId: clientToken.id,
    });
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
