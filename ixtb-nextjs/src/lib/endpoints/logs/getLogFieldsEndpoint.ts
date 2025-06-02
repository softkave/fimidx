import {
  GetLogFieldsEndpointResponse,
  getLogFieldsSchema,
} from "fmdx-core/definitions/log";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { getApp, getLogFields } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getLogFieldsEndpoint: NextUserAuthenticatedEndpointFn<
  GetLogFieldsEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getLogFieldsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.log.read,
  });

  const logFields = await getLogFields({
    appId: input.appId,
    page: input.page,
    limit: input.limit,
  });

  const response: GetLogFieldsEndpointResponse = {
    fields: logFields.fields,
    page: logFields.page,
    limit: logFields.limit,
    hasMore: logFields.hasMore,
  };

  return response;
};
