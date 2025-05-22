import { addAppSchema } from "fmdx-core/definitions/app";
import { AddAppEndpointResponse } from "fmdx-core/definitions/index";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { addApp } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const addAppEndpoint: NextUserAuthenticatedEndpointFn<
  AddAppEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = addAppSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: input.orgId,
    permission: kPermissions.app.update,
  });

  const app = await addApp({ args: input, userId, orgId: input.orgId });
  const response: AddAppEndpointResponse = {
    app,
  };

  return response;
};
