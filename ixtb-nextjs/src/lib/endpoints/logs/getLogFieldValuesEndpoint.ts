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
    groupId: app.groupId,
    permission: kPermissions.log.read,
  });

  const { values, page, limit, hasMore } = await getLogFieldValues({
    appId: app.id,
    page: input.page,
    limit: input.limit,
    field: input.field,
  });

  const response: GetLogFieldValuesEndpointResponse = {
    values,
    page,
    limit,
    hasMore,
  };

  return response;
};
