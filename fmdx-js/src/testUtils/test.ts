import assert from 'assert';

export interface ITestVars {
  authToken: string;
  serverURL: string;
  orgId: string;
  appId: string;
  refreshToken: string;
}

export function getTestVars(): ITestVars {
  const authToken = process.env.FMDX_AUTH_TOKEN;
  const serverURL = process.env.FMDX_SERVER_URL;
  const orgId = process.env.FMDX_ORG_ID;
  const appId = process.env.FMDX_APP_ID;
  const refreshToken = process.env.FMDX_REFRESH_TOKEN;

  assert(authToken, 'FMDX_AUTH_TOKEN is not set');
  assert(serverURL, 'FMDX_SERVER_URL is not set');
  assert(orgId, 'FMDX_ORG_ID is not set');
  assert(appId, 'FMDX_APP_ID is not set');
  assert(refreshToken, 'FMDX_REFRESH_TOKEN is not set');

  return {
    authToken,
    serverURL,
    orgId,
    appId,
    refreshToken,
  };
}
