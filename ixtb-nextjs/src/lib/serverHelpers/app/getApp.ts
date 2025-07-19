import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { IClientToken } from "fmdx-core/definitions/clientToken";
import { getApps } from "fmdx-core/serverHelpers/index";
import { first } from "lodash-es";

export async function getApp(params: {
  input: { appId: string };
  clientToken?: IClientToken;
}) {
  const { input, clientToken } = params;
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

  if (clientToken) {
    assert(
      app?.id === clientToken.appId,
      new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
    );
  }

  return { app };
}
