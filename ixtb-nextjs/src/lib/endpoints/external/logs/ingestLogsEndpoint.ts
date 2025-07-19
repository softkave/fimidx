import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { ingestLogsSchema } from "fmdx-core/definitions/log";
import { kByTypes } from "fmdx-core/definitions/other";
import { getApps, ingestLogs } from "fmdx-core/serverHelpers/index";
import { first } from "lodash-es";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const ingestLogsEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = ingestLogsSchema.parse(await req.json());
  const { apps } = await getApps({
    args: {
      query: {
        id: {
          eq: input.appId,
        },
      },
    },
  });

  const app = first(apps);
  assert(
    app,
    new OwnServerError("App not found", kOwnServerErrorCodes.NotFound)
  );
  assert(
    app?.id === clientToken.appId,
    new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
  );

  await ingestLogs({
    args: input,
    by: clientToken.id,
    byType: kByTypes.clientToken,
    groupId: app.orgId,
  });
};
