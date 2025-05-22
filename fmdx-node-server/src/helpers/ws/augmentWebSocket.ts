import {WebSocket} from 'ws';
import {AugmentedWebSocket} from '../../types/webSocket.js';

export function augmentWebSocket(params: {
  webSocket: WebSocket;
  authId: string;
  appId: string;
  orgId: string;
  socketId: string;
}): AugmentedWebSocket {
  const {webSocket, authId, appId, orgId, socketId} = params;
  (webSocket as AugmentedWebSocket).__fmdxAuthId = authId;
  (webSocket as AugmentedWebSocket).__fmdxAppId = appId;
  (webSocket as AugmentedWebSocket).__fmdxOrgId = orgId;
  (webSocket as AugmentedWebSocket).__fmdxWebSocketId = socketId;
  (webSocket as AugmentedWebSocket).__fmdxIsAugmentedWebSocket = true;
  return webSocket as AugmentedWebSocket;
}
