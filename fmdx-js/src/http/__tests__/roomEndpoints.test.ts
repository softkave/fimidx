import {describe, expect, test} from 'vitest';
import {getTestVars} from '../../testUtils/test.js';
import {FmdxHttpEndpoints} from '../httpEndpoints.js';

const vars = getTestVars();
const endpoints = new FmdxHttpEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

describe('room endpoints', () => {
  test('add room succeeds', async () => {
    const result = await endpoints.rooms.addRoom({
      appId: vars.appId,
      name: 'Test Room',
      description: 'Test Room Description',
    });

    expect(result).toBeDefined();
  });

  test('get room succeeds', async () => {
    const addResult = await endpoints.rooms.addRoom({
      appId: vars.appId,
      name: 'Test Room',
      description: 'Test Room Description',
    });

    const result = await endpoints.rooms.getRoom({
      id: addResult.room.id,
    });

    expect(result).toBeDefined();
    expect(result.room.id).toBe(addResult.room.id);
  });

  test('delete room succeeds', async () => {
    const addResult = await endpoints.rooms.addRoom({
      appId: vars.appId,
      name: 'Test Room',
      description: 'Test Room Description',
    });

    await endpoints.rooms.deleteRoom({
      id: addResult.room.id,
    });
  });

  test('add room subscription succeeds', async () => {
    const addResult = await endpoints.rooms.addRoom({
      appId: vars.appId,
      name: 'Test Room',
      description: 'Test Room Description',
    });

    const subscriptionResult = await endpoints.rooms.addRoomSubscription({
      appId: vars.appId,
      roomId: addResult.room.id,
    });

    expect(subscriptionResult).toBeDefined();
  });

  test('get room subscriptions succeeds', async () => {
    const addResult = await endpoints.rooms.addRoom({
      appId: vars.appId,
      name: 'Test Room',
      description: 'Test Room Description',
    });

    const subscriptionResult = await endpoints.rooms.addRoomSubscription({
      appId: vars.appId,
      roomId: addResult.room.id,
    });

    const subscriptionsResult = await endpoints.rooms.getRoomSubscriptions({
      appId: vars.appId,
      roomId: addResult.room.id,
    });

    expect(subscriptionsResult).toBeDefined();
    expect(subscriptionsResult.roomSubscriptions).toBeDefined();
    expect(subscriptionsResult.roomSubscriptions.length).toBe(1);
    expect(subscriptionsResult.roomSubscriptions[0].id).toBe(
      subscriptionResult.roomSubscription.id,
    );
  });
});
