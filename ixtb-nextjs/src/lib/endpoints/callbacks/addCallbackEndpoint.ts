import { OwnServerError } from "fmdx-core/common/error";
import {
  AddCallbackEndpointArgs,
  addCallbackSchema,
  IAddCallbackEndpointResponse,
  ICallback,
} from "fmdx-core/definitions/index";
import { v7 as uuidv7 } from "uuid";
import {
  getNodeServerInternalAccessKey,
  getNodeServerURL,
} from "../../serverHelpers/nodeServer";
import { NextClientTokenAuthenticatedEndpointFn } from "../types";

async function callNodeServerAddCallback(params: {
  item: AddCallbackEndpointArgs;
  groupId: string;
  clientTokenId: string;
  idempotencyKey: string;
}) {
  const nodeServerURL = getNodeServerURL();
  const nodeServerInternalAccessKey = getNodeServerInternalAccessKey();
  const callParams = {
    item: params.item,
    groupId: params.groupId,
    clientTokenId: params.clientTokenId,
    idempotencyKey: params.idempotencyKey,
  };

  const response = await fetch(`${nodeServerURL}/cb/addCallback`, {
    method: "POST",
    body: JSON.stringify(callParams),
    headers: {
      "X-Internal-Access-Key": nodeServerInternalAccessKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new OwnServerError("Failed to add callback", 500);
  }

  const responseBody = await response.json();
  return responseBody.callback as ICallback;
}

export const addCallbackEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IAddCallbackEndpointResponse
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;
  const input = addCallbackSchema.parse(await req.json());
  const idempotencyKey =
    input.idempotencyKey ?? `__fmdx_generated_${uuidv7()}_${Date.now()}`;
  const callback = await callNodeServerAddCallback({
    item: input,
    groupId: clientToken.groupId,
    clientTokenId: clientToken.id,
    idempotencyKey,
  });

  const response: IAddCallbackEndpointResponse = {
    callback,
  };

  return response;
};
