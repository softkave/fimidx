import {
  getApp,
  tryGetAppWebSocketConfiguration,
} from 'fmdx-core/serverHelpers/index';
import {IncomingMessage} from 'http';
import {isString} from 'lodash-es';
import {match} from 'path-to-regexp';
import {WebSocket} from 'ws';
import {connectWebSocket} from '../../helpers/ws/connectWebSocket.js';

export const kWebSocketAuthHeader = 'x-fmdx-auth-id';
export const kWebSocketPath = '/ws/:appId';

const matchWebSocketPath = match<{appId: string}>(kWebSocketPath);

export async function connectWebSocketEndpoint(params: {
  request: IncomingMessage;
  webSocket: WebSocket;
}) {
  const {request, webSocket} = params;
  if (!request.url) {
    webSocket.close(4404, 'URL is required');
    return;
  }

  const matchResult = matchWebSocketPath(request.url);
  if (!matchResult) {
    webSocket.close(4404, 'Invalid path');
    return;
  }

  const {
    params: {appId},
  } = matchResult;
  const authId = request.headers[kWebSocketAuthHeader];
  const appWebSocketConfiguration = await tryGetAppWebSocketConfiguration({
    args: {appId},
  });

  if (authId && !isString(authId)) {
    webSocket.close(4401, 'Auth ID is invalid');
    return;
  }

  if (!authId && !appWebSocketConfiguration?.allowWebSocketsWithoutAuthIds) {
    webSocket.close(4401, 'Auth ID is required');
    return;
  }

  const app = await getApp({id: appId});
  if (!app) {
    webSocket.close(4404, 'App not found');
    return;
  }

  await connectWebSocket({
    appId,
    authId: authId ?? null,
    orgId: app.orgId,
    webSocket,
  });
}
