import {faker} from '@faker-js/faker';
import assert from 'assert';
import express from 'express';
import type {Server} from 'http';
import {isString, noop} from 'lodash-es';
import type {AnyFn} from 'softkave-js-utils';
import {awaitOrTimeout, getDeferredPromise} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {getTestVars} from '../../testUtils/test.js';
import {FmdxEndpoints} from '../fmdxEndpoints.js';

const vars = getTestVars();
const endpoints = new FmdxEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

const app = express();
const port = faker.internet.port();
const postListenersMap = new Map<string, AnyFn<[express.Request]>[]>();
let server: Server;
app.use(express.json());

function addPostListener(pathname: string, listener: AnyFn<[express.Request]>) {
  if (postListenersMap.has(pathname)) {
    postListenersMap.get(pathname)!.push(listener);
  } else {
    postListenersMap.set(pathname, [listener]);
    app.post(pathname, async (req, res) => {
      const listeners = postListenersMap.get(pathname);
      if (listeners) {
        await Promise.all(listeners.map(listener => listener(req)));
      }
      res.send('Hello, world!');
    });
  }
}

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
  test('add callback with timeout succeeds', async () => {
    const promise = getDeferredPromise<express.Request>();
    const pathname = `/${faker.string.uuid()}`;
    addPostListener(pathname, promise.resolve);

    const result = await endpoints.callbacks.addCallback({
      appId: vars.appId,
      url: `http://localhost:${port}${pathname}`,
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

  test('add callback with interval succeeds', async () => {
    const promise = getDeferredPromise<express.Request>();
    const pathname = `/${faker.string.uuid()}`;
    let count = 0;
    addPostListener(pathname, async req => {
      count++;
      if (count > 1) {
        const callbackId = req.headers['x-fmdx-callback-id'];
        assert(isString(callbackId));
        try {
          await endpoints.callbacks.deleteCallback({id: callbackId});
        } catch (error) {
          // do nothing
        }

        promise.resolve(req);
      }
    });

    const result = await endpoints.callbacks.addCallback({
      appId: vars.appId,
      url: `http://localhost:${port}${pathname}`,
      method: 'POST',
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-Test': 'test',
      },
      requestBody: JSON.stringify({
        message: 'Hello, world!',
      }),
      intervalFrom: new Date(Date.now() + 1_000).toISOString(),
      intervalMs: 1_000,
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
    expect(count).toBeGreaterThan(1);
  });

  test('add callback with idempotency key succeeds', async () => {
    const pathname = `/${faker.string.uuid()}`;
    const idempotencyKey = faker.string.uuid();
    addPostListener(pathname, noop);

    const addCbFn = async () => {
      const result = await endpoints.callbacks.addCallback({
        appId: vars.appId,
        url: `http://localhost:${port}${pathname}`,
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-Test': 'test',
        },
        requestBody: JSON.stringify({
          message: 'Hello, world!',
        }),
        idempotencyKey,
        timeout: new Date(Date.now() + 1_000).toISOString(),
      });

      expect(result).toBeDefined();
      return result;
    };

    const [addCb1, addCb2, addCb3] = await Promise.all([
      addCbFn(),
      addCbFn(),
      addCbFn(),
    ]);

    expect(addCb1.callback.id).toEqual(addCb2.callback.id);
    expect(addCb1.callback.id).toEqual(addCb3.callback.id);
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
