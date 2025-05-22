import assert from "assert";
import { OwnServerError } from "../../common/error.js";
import type { IClientToken } from "../../definitions/clientToken.js";
import { getApp } from "../app/getApp.js";
import { tryGetAuthId } from "./getAuthId.js";

export async function verifyClientTokenAuthIdAccess(params: {
  input: {
    authId?: string;
    appId?: string;
  };
  clientToken: IClientToken;
}) {
  const { input, clientToken } = params;

  const [authId, app] = await Promise.all([
    tryGetAuthId({
      id: input.authId,
      appId: input.appId,
      authId: input.authId,
    }),
    input.appId ? getApp({ id: input.appId }) : null,
  ]);

  let isAuthorized = false;

  if (app) {
    assert(
      app.id === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
    isAuthorized = true;
  }

  if (authId) {
    assert(
      authId.appId === clientToken.appId,
      new OwnServerError("Unauthorized", 403)
    );
    isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new OwnServerError("Unauthorized", 403);
  }
}
