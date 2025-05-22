import axios from 'axios';
import {IWebSocketMessage} from 'fmdx-core/definitions/message';
import {
  tryGetAppWebSocketConfiguration,
  tryGetConnectedWebSocket,
} from 'fmdx-core/serverHelpers/index';
import {kPromiseStore} from '../../ctx/promiseStore.js';

export const kFromSocketIdHeader = 'x-fmdx-from-socket-id';
export const kFromAuthIdHeader = 'x-fmdx-from-auth-id';

export async function sendMessageToServer(params: {
  message: IWebSocketMessage;
}) {
  const appConfiguration = await tryGetAppWebSocketConfiguration({
    args: {
      appId: params.message.appId,
    },
  });

  if (!appConfiguration) {
    return;
  }

  const {sendMessageToServerUrl, sendMessageToServerHeaders} = appConfiguration;
  if (!sendMessageToServerUrl) {
    return;
  }

  if (!params.message.fromSocketId) {
    return;
  }

  const socket = await tryGetConnectedWebSocket({
    id: params.message.fromSocketId,
  });

  kPromiseStore.callAndForget(() =>
    axios({
      method: 'POST',
      url: sendMessageToServerUrl,
      data: params.message,
      headers: {
        ...sendMessageToServerHeaders,
        [kFromSocketIdHeader]: params.message.fromSocketId,
        [kFromAuthIdHeader]: socket?.authId ?? null,
      },
    }),
  );
}
