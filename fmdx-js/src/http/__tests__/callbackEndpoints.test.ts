import {faker} from '@faker-js/faker';
import assert from 'assert';
import express from 'express';
import type {Server} from 'http';
import type {AnyFn} from 'softkave-js-utils';
import {awaitOrTimeout, getDeferredPromise} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {getTestVars} from '../../testUtils/test.js';
import {FmdxHttpEndpoints} from '../httpEndpoints.js';

const vars = getTestVars();
const endpoints = new FmdxHttpEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

const app = express();
const port = faker.internet.port();
const postListeners: AnyFn<[express.Request]>[] = [];
let server: Server;
app.use(express.json());
app.post('/', async (req, res) => {
  await Promise.all(postListeners.map(listener => listener(req)));
  res.send('Hello, world!');
});

beforeAll(async () => {
  await new Promise(resolve => {
    server = app.listen(port, () => {
      resolve(undefined);
    });
  });
});

afterAll(async () => {
  await new Promise(resolve => {
    server.close(() => {
      resolve(undefined);
    });
  });
});

describe('callback endpoints', () => {
  test('add callback succeeds', async () => {
    const promise = getDeferredPromise<express.Request>();
    postListeners.push(promise.resolve);

    const result = await endpoints.callbacks.addCallback({
      appId: vars.appId,
      url: `http://localhost:${port}`,
      method: 'POST',
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-Test': 'test',
      },
      requestBody: JSON.stringify({
        message: 'Hello, world!',
      }),
      timeout: new Date(Date.now() + 5_000).toISOString(),
    });

    expect(result).toBeDefined();

    const cbRequest = await awaitOrTimeout(promise.promise, 15_000);
    assert(!cbRequest.timedout);
    expect(cbRequest.result.body).toMatchObject({
      message: 'Hello, world!',
    });
    expect(cbRequest.result.headers['content-type']).toEqual(
      'application/json',
    );
    expect(cbRequest.result.headers['x-test']).toEqual('test');
  });

  test('delete callback succeeds', async () => {
    const addResult = await endpoints.callbacks.addCallback({
      appId: vars.appId,
      url: `http://localhost:${port}`,
      method: 'POST',
      timeout: new Date(Date.now() + 10_000).toISOString(),
    });

    await endpoints.callbacks.deleteCallback({
      id: addResult.callback.id,
    });
  });
});
