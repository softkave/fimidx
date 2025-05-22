import {
  addWebSocket,
  IAddWebSocketArgs,
} from 'fmdx-core/serverHelpers/webSockets/index';
import {WebSocket} from 'ws';
import {kWebSocketStore} from '../../ctx/webSocketStore.js';
import {AugmentedWebSocket} from '../../types/webSocket.js';

export async function connectWebSocket(
  params: IAddWebSocketArgs & {
    webSocket: WebSocket;
  },
) {
  const {authId, appId, orgId, webSocket} = params;
  const {id} = await addWebSocket({authId, appId, orgId});
  (webSocket as AugmentedWebSocket).__fmdxWebSocketId = id;
  kWebSocketStore[id] = webSocket as AugmentedWebSocket;
  return webSocket;
}
