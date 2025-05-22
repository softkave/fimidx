import {
  getWebSocketMessagesSchema,
  IGetWebSocketMessagesEndpointResponse,
  kPermissions,
} from "fmdx-core/definitions/index";
import { getApp, getWebSocketMessages } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getMessagesEndpoint: NextUserAuthenticatedEndpointFn<
  IGetWebSocketMessagesEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId },
  } = params;
  const input = getWebSocketMessagesSchema.parse(await req.json());

  const app = await getApp({ id: input.appId });
  await checkPermission({
    userId,
    orgId: app.orgId,
    permission: kPermissions.message.read,
  });

  const { messages, total } = await getWebSocketMessages(input);

  const response: IGetWebSocketMessagesEndpointResponse = {
    messages,
    total,
  };

  return response;
};
