import { getApp } from "@/src/lib/serverHelpers/app/getApp";
import {
  addMonitorSchema,
  IAddMonitorEndpointResponse,
} from "fmdx-core/definitions/monitor";
import { addMonitor } from "fmdx-core/serverHelpers/index";
import { NextMaybeAuthenticatedEndpointFn } from "../../types";

export const addMonitorEndpoint: NextMaybeAuthenticatedEndpointFn<
  IAddMonitorEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken, getBy },
  } = params;

  const input = addMonitorSchema.parse(await req.json());
  const { app } = await getApp({
    input: { appId: input.appId },
    clientToken,
  });
  const { monitor } = await addMonitor({
    args: input,
    by: getBy().by,
    byType: getBy().byType,
    groupId: app.orgId,
  });

  const response: IAddMonitorEndpointResponse = {
    monitor,
  };

  return response;
};
