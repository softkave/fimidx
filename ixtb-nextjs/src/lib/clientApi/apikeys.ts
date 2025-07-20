export const kApiGroupKeys = {
  getGroups: () => `/api/groups/fetch`,
  getGroup: (groupId: string) => `/api/groups/${groupId}`,
  addGroup: () => `/api/groups`,
  deleteGroup: () => `/api/groups`,
  updateGroup: (groupId: string) => `/api/groups/${groupId}`,
};

export const kApiOrgKeys = {
  getOrgs: () => `/api/orgs/fetch`,
  getOrg: (orgId: string) => `/api/orgs/${orgId}`,
  addOrg: () => `/api/orgs`,
  deleteOrg: (orgId: string) => `/api/orgs/${orgId}`,
  updateOrg: (orgId: string) => `/api/orgs/${orgId}`,
};

export const kApiAppKeys = {
  getApps: () => `/api/apps/fetch`,
  getApp: (appId: string) => `/api/apps/${appId}`,
  addApp: () => `/api/apps`,
  deleteApp: () => `/api/apps`,
  updateApp: (appId: string) => `/api/apps/${appId}`,
};

export const kApiClientTokenKeys = {
  getClientTokens: () => `/api/client-tokens/fetch`,
  getClientToken: (clientTokenId: string) =>
    `/api/client-tokens/${clientTokenId}`,
  addClientToken: () => `/api/client-tokens`,
  deleteClientToken: () => `/api/client-tokens`,
  updateClientToken: (clientTokenId: string) =>
    `/api/client-tokens/${clientTokenId}`,
  encodeClientTokenJWT: (clientTokenId: string) =>
    `/api/client-tokens/${clientTokenId}/encode`,
  refreshClientTokenJWT: () => `/api/client-tokens/refresh`,
};

export const kApiLogKeys = {
  ingest: () => `/api/logs/ingest`,
  retrieve: () => `/api/logs/retrieve`,
  getLogFields: () => `/api/logs/fields`,
};

export const kApiMonitorKeys = {
  getMonitors: () => `/api/monitors/fetch`,
  getMonitorById: (monitorId: string) => `/api/monitors/${monitorId}`,
  addMonitor: () => `/api/monitors`,
  deleteMonitor: () => `/api/monitors`,
  updateMonitor: (monitorId: string) => `/api/monitors/${monitorId}`,
};

export const kApiMemberKeys = {
  getMembers: () => `/api/members/fetch`,
  addMember: () => `/api/members`,
  removeMember: () => `/api/members`,
  getMemberById: (memberId: string) => `/api/members/${memberId}`,
  updateMemberById: (memberId: string) => `/api/members/${memberId}`,
  getMemberRequests: () => `/api/members/requests`,
  respondToMemberRequest: (memberId: string) =>
    `/api/members/${memberId}/respond`,
};

export const kApiCallbackKeys = {
  getCallbacks: () => `/api/callbacks/fetch`,
  addCallback: () => `/api/callbacks`,
  getCallback: (callbackId: string) => `/api/callbacks/${callbackId}`,
  deleteCallback: () => `/api/callbacks`,
  updateCallback: (callbackId: string) => `/api/callbacks/${callbackId}`,
};
