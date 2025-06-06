import { UpdateAppEndpointResponse } from "fmdx-core/definitions/index";

import { updateApp } from "fmdx-core/serverHelpers/index";

import { updateAppSchema } from "fmdx-core/definitions/app";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getApp } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateAppEndpoint: NextUserAuthenticatedEndpointFn<
  UpdateAppEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const appUpdateInput = updateAppSchema.parse(await req.json());

  const app = await getApp({ id: appUpdateInput.id });
  await checkPermission({
    userId,
    groupId: app.groupId,
    permission: kPermissions.app.update,
  });

  const updatedApp = await updateApp({
    args: appUpdateInput,
    userId,
    existingApp: app,
  });

  const response: UpdateAppEndpointResponse = {
    app: updatedApp,
  };

  return response;
};
