import assert from 'assert';

export interface ITestVars {
  authToken: string;
  serverURL: string;
  groupId: string;
  appId: string;
  refreshToken: string;
}

export function getTestVars(): ITestVars {
  const authToken = process.env.FIMIDX_AUTH_TOKEN;
  const serverURL = process.env.FIMIDX_SERVER_URL;
  const groupId = process.env.FIMIDX_GROUP_ID;
  const appId = process.env.FIMIDX_APP_ID;
  const refreshToken = process.env.FIMIDX_REFRESH_TOKEN;

  assert(authToken, 'FIMIDX_AUTH_TOKEN is not set');
  assert(serverURL, 'FIMIDX_SERVER_URL is not set');
  assert(groupId, 'FIMIDX_GROUP_ID is not set');
  assert(appId, 'FIMIDX_APP_ID is not set');
  assert(refreshToken, 'FIMIDX_REFRESH_TOKEN is not set');

  return {
    authToken,
    serverURL,
    groupId,
    appId,
    refreshToken,
  };
}
