import {deleteConnectedWebSocket} from 'fmdx-core/serverHelpers/index';
import {kWebSocketStore} from '../../ctx/webSocketStore.js';

export async function disconnectWebSocket(params: {id: string}) {
  const {id} = params;
  delete kWebSocketStore[id];
  await deleteConnectedWebSocket({id});
}
