import { getAppSchema } from "fmdx-core/definitions/app";
import { kPermissions } from "fmdx-core/definitions/permissions";
import {
  checkPermission,
  deleteApp,
  getApp,
} from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const deleteAppEndpoint: NextUserAuthenticatedEndpointFn<void> = async (
  params
) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getAppSchema.parse(await req.json());

  const app = await getApp({ id: input.id });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.app.delete,
  });

  await deleteApp({ id: input.id });
};
