import {WebSocket} from 'ws';
import {AugmentedWebSocket} from '../../types/webSocket.js';

export function isAugmentedWebSocket(
  webSocket: WebSocket,
): webSocket is AugmentedWebSocket {
  return (webSocket as AugmentedWebSocket).__fmdxIsAugmentedWebSocket;
}
