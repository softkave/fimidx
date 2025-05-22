import {
  GetLogFieldValuesEndpointResponse,
  getLogFieldValuesSchema,
} from "fmdx-core/definitions/log";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getApp, getLogFieldValues } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getLogFieldValuesEndpoint: NextUserAuthenticatedEndpointFn<
  GetLogFieldValuesEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getLogFieldValuesSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.log.read,
  });

  const { values, page, total } = await getLogFieldValues({
    args: input,
    appId: app.id,
    orgId: app.orgId,
  });

  const response: GetLogFieldValuesEndpointResponse = {
    values,
    page,
    total,
  };

  return response;
};
