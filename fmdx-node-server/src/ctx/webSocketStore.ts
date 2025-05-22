import {AugmentedWebSocket} from '../types/webSocket.js';

export type IWebSocketStore = Record<string, AugmentedWebSocket>;

export const kWebSocketStore: IWebSocketStore = {};
