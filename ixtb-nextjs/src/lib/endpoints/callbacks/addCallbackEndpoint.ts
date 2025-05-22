import { OwnServerError } from "fmdx-core/common/error";
import {
  addCallbackSchema,
  IAddCallbackEndpointResponse,
  ICallback,
} from "fmdx-core/definitions/index";
import { addCallback } from "fmdx-core/serverHelpers/index";
import {
  getNodeServerInternalAccessKey,
  getNodeServerURL,
} from "../../serverHelpers/nodeServer";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

async function callNodeServerAddCallback(callback: ICallback) {
  if (!callback.timeout) {
    return;
  }

  const nodeServerURL = getNodeServerURL();
  const nodeServerInternalAccessKey = getNodeServerInternalAccessKey();
  const params = {
    id: callback.id,
    timeout: new Date(callback.timeout).toISOString(),
  };
  const response = await fetch(`${nodeServerURL}/cb/addCallback`, {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "X-Internal-Access-Key": nodeServerInternalAccessKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new OwnServerError("Failed to add callback", 500);
  }
}

export const addCallbackEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddCallbackEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = addCallbackSchema.parse(await req.json());

  const callback = await addCallback({
    args: input,
    orgId: clientToken.orgId,
    appId: clientToken.appId,
    clientTokenId: clientToken.id,
  });

  await callNodeServerAddCallback(callback);

  const response: IAddCallbackEndpointResponse = {
    callback,
  };

  return response;
};
