import assert from 'assert';
import {loadCallbacks} from './helpers/cb/loadCallbacks.js';
import {startHttpServer} from './httpServer.js';
import {startWebSocketServer} from './webSocketServer.js';
import {setupIndexObjsCallback} from './helpers/obj/setupIndexObjsCallback.js';

async function main() {
  const httpPort = process.env.HTTP_PORT;
  const internalAccessKey = process.env.INTERNAL_ACCESS_KEY;
  const webSocketPort = process.env.WEBSOCKET_PORT;

  assert(httpPort, 'HTTP_PORT is required');
  assert(internalAccessKey, 'INTERNAL_ACCESS_KEY is required');
  assert(webSocketPort, 'WEBSOCKET_PORT is required');

  await loadCallbacks();
  await setupIndexObjsCallback();

  startHttpServer({
    port: parseInt(httpPort),
    internalAccessKey,
  });

  startWebSocketServer({
    port: parseInt(webSocketPort),
  });
}

main();
