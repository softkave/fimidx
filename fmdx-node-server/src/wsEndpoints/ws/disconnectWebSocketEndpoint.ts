import {WebSocket} from 'ws';
import {disconnectWebSocket} from '../../helpers/ws/disconnectWebSocket.js';
import {AugmentedWebSocket} from '../../types/webSocket.js';

export async function disconnectWebSocketEndpoint(params: {
  webSocket: WebSocket;
}) {
  const {webSocket} = params;
  const id = (webSocket as AugmentedWebSocket).__fmdxWebSocketId;

  if (!id) {
    webSocket.close(4503, 'Invalid WebSocket');
    return;
  }

  await disconnectWebSocket({id});
}
