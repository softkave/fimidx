import {describe, test} from 'vitest';
import {getTestVars} from '../../testUtils/test.js';
import {FmdxHttpEndpoints} from '../httpEndpoints.js';

const vars = getTestVars();
const endpoints = new FmdxHttpEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

describe.skip('client token endpoints', () => {
  test('refresh client token succeeds', async () => {
    // const result = await endpoints.clientTokens.refreshClientToken(
    //   {refreshToken: vars.refreshToken},
    //   {authToken: vars.authToken},
    // );
    // expect(result).toBeDefined();
    // expect(result.token).toBeDefined();
    // expect(result.refreshToken).toBeDefined();
  });
});
