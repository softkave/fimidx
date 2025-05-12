import {faker} from '@faker-js/faker';
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import {WebSocket} from 'ws';
import {closeServer, startServer} from '../server.js';
import {WsMessage, WsResponse} from '../types.js';

let port = faker.number.int({min: 10000, max: 65535});
let leader: WebSocket | undefined;
let followers: WebSocket[] = [];

async function waitForOpen(ws: WebSocket) {
  await new Promise(resolve => {
    ws.once('open', resolve);
  });
}

function waitForResponseText(ws: WebSocket) {
  return new Promise<string>(resolve => {
    ws.once('message', message => {
      resolve(message.toString());
    });
  });
}

function waitForResponseJson(ws: WebSocket, messageId?: string) {
  return new Promise<WsResponse>(resolve => {
    ws.once('message', message => {
      const response = JSON.parse(message.toString());
      if (!messageId || response.messageId === messageId) {
        resolve(response);
      }
    });
  });
}

beforeAll(async () => {
  await startServer(port);
});

beforeEach(async () => {
  leader = new WebSocket(`ws://localhost:${port}`);
  followers = Array.from(
    {length: 3},
    () => new WebSocket(`ws://localhost:${port}`),
  );

  await Promise.all([waitForOpen(leader), ...followers.map(waitForOpen)]);
});

afterEach(async () => {
  leader?.close();
  followers.forEach(follower => follower.close());
});

afterAll(async () => {
  await closeServer();
});

async function createRoom(creator: WebSocket) {
  const roomId = faker.string.uuid();
  const messageId = faker.string.uuid();
  const message: WsMessage = {
    type: 'createRoom',
    roomId,
    messageId,
  };

  creator.send(JSON.stringify(message));

  const response = await waitForResponseJson(creator);
  expect(response.type).toBe('ack');
  expect(response.messageId).toBe(messageId);

  return roomId;
}

async function joinRoom(
  joiner: WebSocket,
  roomId: string,
  createIfMissing?: boolean,
) {
  const messageId = faker.string.uuid();
  const message: WsMessage = {
    type: 'joinRoom',
    roomId,
    messageId,
    createIfMissing,
  };

  joiner.send(JSON.stringify(message));

  const response = await waitForResponseJson(joiner);
  expect(response.type).toBe('ack');
  expect(response.messageId).toBe(messageId);
}

async function getRoomList(ws: WebSocket) {
  const messageId = faker.string.uuid();
  const message: WsMessage = {
    type: 'getRoomList',
    messageId,
  };

  ws.send(JSON.stringify(message));

  const response = await waitForResponseJson(ws, messageId);
  expect(response.type).toBe('roomList');
  assert(response.type === 'roomList');
  return response.roomList;
}

describe('Server', () => {
  test('create room', async () => {
    assert(leader, 'Leader is not connected');

    await createRoom(leader);
  });

  test('join room', async () => {
    assert(leader, 'Leader is not connected');

    const roomId = await createRoom(leader);

    await Promise.all(followers.map(follower => joinRoom(follower, roomId)));
  });

  test('join room with createIfMissing', async () => {
    assert(leader, 'Leader is not connected');

    const roomId = faker.string.uuid();
    await joinRoom(leader, roomId, true);
    const roomList = await getRoomList(leader);
    expect(roomList).toContain(roomId);
  });

  test('send message to room', async () => {
    assert(leader, 'Leader is not connected');

    const roomId = await createRoom(leader);
    await Promise.all(followers.map(follower => joinRoom(follower, roomId)));

    const messageText = faker.lorem.sentence();
    const messageId = faker.string.uuid();
    const message: WsMessage = {
      messageId,
      type: 'sendMessageToRoom',
      roomId,
      message: messageText,
    };

    followers.forEach(follower => follower.pause());

    leader.send(JSON.stringify(message));
    const response = await waitForResponseJson(leader);
    expect(response.type).toBe('ack');
    expect(response.messageId).toBe(messageId);
    followers.forEach(follower => follower.resume());
    const responses = await Promise.all(
      followers.map(follower => waitForResponseText(follower)),
    );

    expect(responses.every(response => response === messageText)).toBe(true);
  });

  test('get room list', async () => {
    assert(leader, 'Leader is not connected');

    const roomId01 = await createRoom(leader);
    const roomId02 = await createRoom(leader);
    const follower01 = followers[0];
    await joinRoom(follower01, roomId01);
    await joinRoom(follower01, roomId02);
    const roomList = await getRoomList(follower01);
    expect(roomList).toContain(roomId01);
    expect(roomList).toContain(roomId02);
  });

  test('leave all rooms', async () => {
    assert(leader, 'Leader is not connected');

    const roomId01 = await createRoom(leader);
    const roomId02 = await createRoom(leader);
    const follower01 = followers[0];
    await joinRoom(follower01, roomId01);
    await joinRoom(follower01, roomId02);

    const messageId = faker.string.uuid();
    const message: WsMessage = {
      messageId,
      type: 'leaveAllRooms',
    };

    follower01.send(JSON.stringify(message));
    const response = await waitForResponseJson(follower01);
    expect(response.type).toBe('ack');
    expect(response.messageId).toBe(messageId);

    const roomList = await getRoomList(follower01);
    expect(roomList).not.toContain(roomId01);
    expect(roomList).not.toContain(roomId02);
  });

  test('room exists', async () => {
    assert(leader, 'Leader is not connected');

    const roomId = await createRoom(leader);
    const messageId = faker.string.uuid();
    const message: WsMessage = {
      messageId,
      type: 'roomExists',
      roomId,
    };

    leader.send(JSON.stringify(message));
    const response = await waitForResponseJson(leader, messageId);
    expect(response.type).toBe('roomExists');
    assert(response.type === 'roomExists');
    expect(response.messageId).toBe(messageId);
    expect(response.exists).toBe(true);
  });
});
