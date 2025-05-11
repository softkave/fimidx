import {
  GetLogFieldValuesEndpointResponse,
  getLogFieldValuesSchema,
} from "@/src/definitions/log";
import { kPermissions } from "@/src/definitions/permissions";
import { getLogFieldValues } from "@/src/lib/serverHelpers/logs/getLogFieldValues";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
  };
  const input = getLogFieldValuesSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.log.read,
  });

  const { values, page, total } = await getLogFieldValues({
    args: input,
    appId: params.appId,
    orgId: params.orgId,
  });

  const response: GetLogFieldValuesEndpointResponse = {
    values,
    page,
    total,
  };

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
