import {kWildcard} from 'fmdx-core/definitions/other';
import {
  getAllAuthItemsForAuthId,
  getAuthItemList,
} from 'fmdx-core/serverHelpers/index';
import {addMessage} from 'fmdx-core/serverHelpers/message/addMessage';
import {WebSocket} from 'ws';
import {kPromiseStore} from '../../ctx/promiseStore.js';
import {fanoutMessage} from '../../helpers/ws/fanoutMessage.js';
import {isAugmentedWebSocket} from '../../helpers/ws/isAugmentedWebSocket.js';
import {
  IIncomingWebSocketMessage,
  IOutgoingWebSocketError,
  kOutgoingWebSocketMessageType,
} from '../../types/webSocket.js';

export async function sendMessageEndpoint(params: {
  webSocket: WebSocket;
  incomingMessage: IIncomingWebSocketMessage;
}) {
  const {webSocket, incomingMessage} = params;

  if (!isAugmentedWebSocket(webSocket)) {
    (webSocket as WebSocket).close(4503, 'Invalid WebSocket');
    return;
  }

  const [wildcardAuthItems, authIdAuthItems] = await Promise.all([
    getAllAuthItemsForAuthId({appId: webSocket.__fmdxAppId, authId: kWildcard}),
    webSocket.__fmdxAuthId
      ? getAuthItemList({
          appId: webSocket.__fmdxAppId,
          authId: webSocket.__fmdxAuthId,
        })
      : null,
  ]);

  let isAllowedToMessageRoom = incomingMessage.toRoomId ? false : true;
  let isAllowedToMessageSocket = incomingMessage.toSocketId ? false : true;
  let isAllowedToMessageServer = incomingMessage.toServer ? false : true;
  let isAllowedToMessageAuthId = incomingMessage.toAuthId ? false : true;
  let isAllowed =
    isAllowedToMessageAuthId &&
    isAllowedToMessageRoom &&
    isAllowedToMessageSocket &&
    isAllowedToMessageServer;

  const authItems = [
    ...wildcardAuthItems,
    ...(authIdAuthItems?.authItems ?? []),
  ];

  for (const authItem of authItems) {
    if (isAllowed) {
      break;
    }

    if (incomingMessage.toRoomId && !isAllowedToMessageRoom) {
      isAllowedToMessageRoom =
        authItem.messageRoomId === incomingMessage.toRoomId ||
        authItem.messageRoomId === kWildcard;
    }

    if (incomingMessage.toSocketId && !isAllowedToMessageSocket) {
      isAllowedToMessageSocket =
        authItem.messageSocketId === incomingMessage.toSocketId ||
        authItem.messageSocketId === kWildcard;
    }

    if (incomingMessage.toServer && !isAllowedToMessageServer) {
      isAllowedToMessageServer = authItem.messageServer ?? false;
    }

    if (incomingMessage.toAuthId && !isAllowedToMessageAuthId) {
      isAllowedToMessageAuthId =
        authItem.messageAuthId === incomingMessage.toAuthId ||
        authItem.messageAuthId === kWildcard;
    }

    isAllowed =
      isAllowedToMessageAuthId &&
      isAllowedToMessageRoom &&
      isAllowedToMessageSocket &&
      isAllowedToMessageServer;
  }

  if (!isAllowed) {
    const response: IOutgoingWebSocketError = {
      type: kOutgoingWebSocketMessageType.error,
      error: 'Access Denied',
    };

    (webSocket as WebSocket).send(JSON.stringify(response));
    return;
  }

  const messageToSend = await addMessage({
    fromSocketId: webSocket.__fmdxWebSocketId,
    fromAuthId: webSocket.__fmdxAuthId,
    message: incomingMessage.message,
    orgId: webSocket.__fmdxOrgId,
    appId: webSocket.__fmdxAppId,
    toRoomId: incomingMessage.toRoomId ?? null,
    toSocketId: incomingMessage.toSocketId ?? null,
    toAuthId: incomingMessage.toAuthId ?? null,
    toServer: incomingMessage.toServer ?? null,
  });

  kPromiseStore.callAndForget(() =>
    fanoutMessage({messageId: messageToSend.id}),
  );
}
