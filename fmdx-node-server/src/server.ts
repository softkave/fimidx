import assert from 'assert';
import {WebSocket, WebSocketServer} from 'ws';
import {WsMessage, wsMessageSchema, WsResponse} from './types.js';

let wss: WebSocketServer | undefined;

const rooms = new Map<string, Set<WebSocket>>();
const wsToRooms = new Map<WebSocket, Set<string>>();

function createRoom(roomId: string) {
  if (rooms.has(roomId)) {
    return;
  }

  rooms.set(roomId, new Set());
}

function joinRoom(roomId: string, createIfMissing: boolean, ws: WebSocket) {
  if (!rooms.has(roomId)) {
    if (createIfMissing) {
      createRoom(roomId);
    } else {
      throw new Error('Room does not exist');
    }
  }

  rooms.get(roomId)?.add(ws);

  if (wsToRooms.has(ws)) {
    wsToRooms.get(ws)?.add(roomId);
  } else {
    wsToRooms.set(ws, new Set([roomId]));
  }
}

function leaveRoom(roomId: string, ws: WebSocket) {
  rooms.get(roomId)?.delete(ws);

  if (rooms.get(roomId)?.size === 0) {
    rooms.delete(roomId);
  }

  wsToRooms.get(ws)?.delete(roomId);
}

function leaveAllRooms(ws: WebSocket) {
  wsToRooms.get(ws)?.forEach(roomId => {
    leaveRoom(roomId, ws);
  });
}

function getRoomList(ws: WebSocket) {
  return Array.from(wsToRooms.get(ws) ?? []);
}

function sendMessageToRoom(roomId: string, message: string, sender: WebSocket) {
  if (!rooms.has(roomId)) {
    throw new Error('Room does not exist');
  }

  const closed = new Set<WebSocket>();
  const wsList = rooms.get(roomId);

  wsList?.forEach(ws => {
    if (ws === sender) {
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else if (ws.readyState === WebSocket.CLOSED) {
      closed.add(ws);
    }
  });

  closed.forEach(ws => {
    leaveRoom(roomId, ws);
  });
}

function roomExists(roomId: string) {
  return rooms.has(roomId);
}

function getPort(inputPort?: number) {
  if (inputPort) {
    return inputPort;
  }

  const portStr = process.env.PORT;
  assert(portStr, new Error('PORT is not set'));

  const port = parseInt(portStr, 10);
  assert(!isNaN(port), new Error('PORT is not a number'));

  return port;
}

export function startServer(port?: number) {
  if (wss) {
    throw new Error('Server already started');
  }

  wss = new WebSocketServer({port: getPort(port)});
  wss.on('connection', function connection(ws) {
    ws.on('error', error => {
      console.error(error);
    });

    ws.on('message', function message(data) {
      try {
        const strData = data.toString();
        const messageRaw = JSON.parse(strData);
        let response: WsResponse | undefined;

        try {
          const message = wsMessageSchema.parse(messageRaw);
          switch (message.type) {
            case 'createRoom':
              createRoom(message.roomId);
              break;
            case 'joinRoom':
              joinRoom(message.roomId, message.createIfMissing ?? false, ws);
              break;
            case 'leaveRoom':
              leaveRoom(message.roomId, ws);
              break;
            case 'sendMessageToRoom':
              sendMessageToRoom(message.roomId, message.message, ws);
              break;
            case 'getRoomList':
              const roomList = getRoomList(ws);
              response = {
                messageId: message.messageId,
                type: 'roomList',
                roomList,
              };
              break;
            case 'leaveAllRooms':
              leaveAllRooms(ws);
              break;
            case 'roomExists':
              response = {
                messageId: message.messageId,
                type: 'roomExists',
                exists: roomExists(message.roomId),
              };
              break;
            default:
              throw new Error('Invalid message type');
          }

          if (!response) {
            response = {
              messageId: message.messageId,
              type: 'ack',
              message: 'Message received',
            };
          }

          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error(error);

          const response: WsResponse = {
            messageId: (message as unknown as WsMessage).messageId,
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          };

          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error(error);
        const response: WsResponse = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        };

        ws.send(JSON.stringify(response));
      }
    });

    ws.on('close', () => {
      wsToRooms.get(ws)?.forEach(roomId => {
        leaveRoom(roomId, ws);
      });
    });
  });

  return new Promise<void>(resolve => {
    wss?.on('listening', () => {
      console.log('listening', wss?.address());
      resolve();
    });
  });
}

export function closeServer() {
  wss?.close();
  wss = undefined;
}
