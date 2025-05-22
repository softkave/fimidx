import {WebSocketServer} from 'ws';
import {kPromiseStore} from './ctx/promiseStore.js';
import {
  incomingWebSocketMessageSchema,
  kIncomingWebSocketMessageType,
} from './types/webSocket.js';
import {tryJsonParse} from './utils/tryJsonParse.js';
import {connectWebSocketEndpoint} from './wsEndpoints/ws/connectWebSocketEndpoint.js';
import {disconnectWebSocketEndpoint} from './wsEndpoints/ws/disconnectWebSocketEndpoint.js';
import {sendMessageEndpoint} from './wsEndpoints/ws/sendMessageEndpoint.js';

export async function startWebSocketServer(params: {port: number}) {
  const {port} = params;
  const wss = new WebSocketServer({port});
  wss.on('connection', function connection(ws, req) {
    connectWebSocketEndpoint({request: req, webSocket: ws}).then(() => {
      ws.on('error', error => {
        console.error(error);
      });

      ws.on('message', function message(data) {
        const messageRaw = tryJsonParse(data.toString());
        if (messageRaw) {
          const message = incomingWebSocketMessageSchema.parse(messageRaw);
          if (message.type === kIncomingWebSocketMessageType.sendMessage) {
            kPromiseStore.callAndForget(() =>
              sendMessageEndpoint({
                webSocket: ws,
                incomingMessage: message,
              }),
            );
          }
        }
      });

      ws.on('close', () => {
        kPromiseStore.callAndForget(() =>
          disconnectWebSocketEndpoint({webSocket: ws}),
        );
      });
    });
  });

  return new Promise<void>(resolve => {
    wss?.on('listening', () => {
      console.log('WebSocket server listening', wss?.address());
      resolve();
    });
  });
}
