import { getAppSchema } from "@/src/definitions/app";
import { GetLogFieldsEndpointResponse } from "@/src/definitions/log";
import { kPermissions } from "@/src/definitions/permissions";
import { getLogFields } from "@/src/lib/serverHelpers/logs/getLogFields";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
  };
  const input = getAppSchema.parse({
    id: params.appId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.log.read,
  });

  const logFields = await getLogFields({
    appId: input.id,
    orgId: params.orgId,
  });

  const response: GetLogFieldsEndpointResponse = {
    fields: logFields,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
