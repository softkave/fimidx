import { getAppSchema } from "fmdx-core/definitions/app";
import { GetAppEndpointResponse } from "fmdx-core/definitions/index";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getApp } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getAppEndpoint: NextUserAuthenticatedEndpointFn<
  GetAppEndpointResponse
> = async (params) => {
  const {
    session: { userId },
    ctx,
  } = params;
  const pathParams = (await ctx.params) as { appId: string };
  const input = getAppSchema.parse({
    id: pathParams.appId,
  });

  const app = await getApp({ id: input.id });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.app.read,
  });

  const response: GetAppEndpointResponse = {
    app,
  };

  return response;
};
