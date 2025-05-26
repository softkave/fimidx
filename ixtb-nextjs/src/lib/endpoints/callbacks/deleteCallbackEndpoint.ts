import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { deleteCallbackSchema, ICallback } from "fmdx-core/definitions/index";
import { deleteCallback, getCallback } from "fmdx-core/serverHelpers/index";
import {
  getNodeServerInternalAccessKey,
  getNodeServerURL,
} from "../../serverHelpers/nodeServer";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

async function callNodeServerDeleteCallback(callback: ICallback) {
  const nodeServerURL = getNodeServerURL();
  const nodeServerInternalAccessKey = getNodeServerInternalAccessKey();

  const response = await fetch(`${nodeServerURL}/cb/removeCallback`, {
    method: "POST",
    body: JSON.stringify({
      id: callback.id,
    }),
    headers: {
      "X-Internal-Access-Key": nodeServerInternalAccessKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new OwnServerError("Failed to delete callback", 500);
  }
}

export const deleteCallbackEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteCallbackSchema.parse(await req.json());

  const callback = await getCallback({
    id: input.id,
    appId: input.appId,
    idempotencyKey: input.idempotencyKey,
  });
  assert(
    callback.appId === clientToken.appId,
    new OwnServerError("Callback not found", kOwnServerErrorCodes.NotFound)
  );

  await deleteCallback({
    id: callback.id,
    appId: callback.appId,
    idempotencyKey: input.idempotencyKey,
    acknowledgeDeleteAllForApp: input.acknowledgeDeleteAllForApp,
  });

  await callNodeServerDeleteCallback(callback);
};
