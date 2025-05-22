import {IWebSocketMessage} from 'fmdx-core/definitions/message';
import {
  getRoom,
  getRoomSubscriptions,
  tryGetConnectedWebSocket,
} from 'fmdx-core/serverHelpers/index';
import {getMessageById} from 'fmdx-core/serverHelpers/message/index';
import {kWebSocketStore} from '../../ctx/webSocketStore.js';
import {
  IOutgoingWebSocketMessage,
  kOutgoingWebSocketMessageType,
} from '../../types/webSocket.js';
import {sendMessageToServer} from './sendMessageToServer.js';

async function fanoutMessageToSocket(params: {
  outgoingMessage: IOutgoingWebSocketMessage;
  socketId: string;
}) {
  const {outgoingMessage, socketId} = params;
  const socket = kWebSocketStore[socketId];

  if (!socket) {
    return;
  }

  socket.send(JSON.stringify(outgoingMessage));
}

async function fanoutMessageToAuthId(params: {
  outgoingMessage: IOutgoingWebSocketMessage;
  authId: string;
}) {
  const {outgoingMessage, authId} = params;
  const socket = await tryGetConnectedWebSocket({authId});

  if (!socket) {
    return;
  }

  await fanoutMessageToSocket({
    outgoingMessage,
    socketId: socket.id,
  });
}

async function fanoutMessageToRoom(params: {
  outgoingMessage: IOutgoingWebSocketMessage;
  roomId: string;
}) {
  const {outgoingMessage, roomId} = params;
  const room = await getRoom({id: roomId});

  if (!room) {
    return;
  }

  let page = 0;
  const pageSize = 100;
  let result = await getRoomSubscriptions({
    page,
    roomId: roomId,
    limit: pageSize,
  });

  while (result.roomSubscriptions.length > 0) {
    await Promise.allSettled(
      result.roomSubscriptions.map(async subscription => {
        if (subscription.socketId) {
          await fanoutMessageToSocket({
            outgoingMessage,
            socketId: subscription.socketId,
          });
        } else if (subscription.authId) {
          await fanoutMessageToAuthId({
            outgoingMessage,
            authId: subscription.authId,
          });
        }
      }),
    );

    page++;
    result = await getRoomSubscriptions({
      page,
      roomId: roomId,
      limit: pageSize,
    });
  }
}

export async function fanoutMessage(params: {messageId: string}) {
  const {messageId} = params;
  const message: IWebSocketMessage | null = await getMessageById({messageId});
  if (!message) {
    return;
  }

  if (message.toRoomId) {
    await fanoutMessageToRoom({
      outgoingMessage: {
        type: kOutgoingWebSocketMessageType.receivedMessage,
        message: message.message,
        roomId: message.toRoomId,
        fromServer: message.fromServer ?? null,
      },
      roomId: message.toRoomId,
    });
  } else if (message.toSocketId) {
    await fanoutMessageToSocket({
      outgoingMessage: {
        type: kOutgoingWebSocketMessageType.receivedMessage,
        message: message.message,
        roomId: null,
        fromServer: message.fromServer ?? null,
      },
      socketId: message.toSocketId,
    });
  } else if (message.toServer) {
    await sendMessageToServer({message});
  } else if (message.toAuthId) {
    await fanoutMessageToAuthId({
      outgoingMessage: {
        type: kOutgoingWebSocketMessageType.receivedMessage,
        message: message.message,
        roomId: null,
        fromServer: message.fromServer ?? null,
      },
      authId: message.toAuthId,
    });
  }
}
