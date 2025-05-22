import type {FmdxEndpointHeaders} from './types.js';

export type FmdxEndpointErrorItem = {
  name: string;
  field?: string;
  message: string;

  // TODO: find a way to include in generated doc for when we add new
  // recommended actions
  action?: 'logout' | 'loginAgain' | 'requestChangePassword';
};

export class FmdxEndpointError extends Error {
  name = 'FmdxEndpointError';
  isFmdxEndpointError = true;

  constructor(
    public errors: Array<FmdxEndpointErrorItem>,
    public statusCode?: number,
    public statusText?: string,
    public headers?: FmdxEndpointHeaders,
  ) {
    super(
      errors.map(item => item.message).join('\n') ||
        'fmdx endpoint error. ' +
          'This could be because the client is not able to connect to the server. ' +
          'Please check your internet connection or check with Support if the issue persists.',
    );
  }
}
