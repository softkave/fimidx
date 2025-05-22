import { addLogsSchema } from "fmdx-core/definitions/log";
import { addLogs, getApp } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const ingestLogsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken, checkOrgId },
  } = params;
  const input = addLogsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  checkOrgId(app.orgId);

  await addLogs({
    appId: app.id,
    inputLogs: input.logs,
    orgId: app.orgId,
    clientTokenId: clientToken.id,
  });
};
