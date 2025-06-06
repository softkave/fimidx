import {
  GetAppsEndpointResponse,
  getAppsSchema,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getAppList } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getAppsEndpoint: NextUserAuthenticatedEndpointFn<
  GetAppsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getAppsSchema.parse(await req.json());

  await checkPermission({
    userId,
    groupId: input.groupId,
    permission: kPermissions.app.read,
  });

  const { apps, total } = await getAppList({
    args: input,
    groupId: input.groupId,
  });

  const response: GetAppsEndpointResponse = {
    apps,
    total,
  };

  return response;
};
