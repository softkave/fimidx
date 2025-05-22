import {describe, expect, test} from 'vitest';
import {getTestVars} from '../../testUtils/test.js';
import {FmdxHttpEndpoints} from '../httpEndpoints.js';

const vars = getTestVars();
const endpoints = new FmdxHttpEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

describe('log endpoints', () => {
  test('ingest logs succeeds', async () => {
    const result = await endpoints.logs.ingestLogs({
      appId: vars.appId,
      logs: [
        {
          message: 'Hello, world!',
          level: 'info',
          timestamp: new Date(),
        },
        {
          message: 'Hello, world!',
          level: 'info',
        },
        {
          some: 'other',
        },
      ],
    });

    expect(result).toBeDefined();
  });
});
