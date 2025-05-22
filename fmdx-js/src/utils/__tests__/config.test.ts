import {describe, expect, test} from 'vitest';
import {FmdxHttpEndpoints} from '../../http/httpEndpoints.js';

describe('config', () => {
  test('config changes cascades', async () => {
    const oldAuthToken = Math.random().toString();
    const newAuthToken = Math.random().toString();

    const fmdx = new FmdxHttpEndpoints({authToken: oldAuthToken});

    expect(fmdx.getSdkConfig().authToken).toBe(oldAuthToken);
    fmdx.setSdkConfig({authToken: newAuthToken});
    expect(fmdx.getSdkConfig().authToken).toBe(newAuthToken);
  });
});
