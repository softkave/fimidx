import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { ingestLogsSchema } from "fmdx-core/definitions/log";
import { kByTypes } from "fmdx-core/definitions/other";
import { getApp, ingestLogs } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

export const ingestLogsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = ingestLogsSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  assert(
    app.id === clientToken.appId,
    new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
  );

  await ingestLogs({
    appId: app.id,
    logs: input.logs,
    groupId: app.groupId,
    by: clientToken.id,
    byType: kByTypes.clientToken,
  });
};
