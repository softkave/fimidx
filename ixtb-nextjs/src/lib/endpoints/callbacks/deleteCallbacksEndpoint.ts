import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import {
  DeleteCallbacksEndpointArgs,
  deleteCallbacksSchema,
} from "fmdx-core/definitions/index";
import { getApp } from "fmdx-core/serverHelpers/index";
import {
  getNodeServerInternalAccessKey,
  getNodeServerURL,
} from "../../serverHelpers/nodeServer";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

async function callNodeServerDeleteCallback(
  input: DeleteCallbacksEndpointArgs & { clientTokenId: string }
) {
  const nodeServerURL = getNodeServerURL();
  const nodeServerInternalAccessKey = getNodeServerInternalAccessKey();

  const response = await fetch(`${nodeServerURL}/cb/deleteCallbacks`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "X-Internal-Access-Key": nodeServerInternalAccessKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new OwnServerError("Failed to delete callbacks", 500);
  }
}

export const deleteCallbacksEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = deleteCallbacksSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  assert(
    app.id === clientToken.appId,
    new OwnServerError("Permission denied", kOwnServerErrorCodes.Forbidden)
  );

  await callNodeServerDeleteCallback({
    ...input,
    clientTokenId: clientToken.id,
  });
};
