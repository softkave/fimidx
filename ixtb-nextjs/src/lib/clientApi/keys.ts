export const kApiOrgSWRKeys = {
  getOrgs: (page?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/orgs${queryString ? `?${queryString}` : ""}`;
  },
  getOrg: (orgId: string) => `/api/orgs/${orgId}`,
  addOrg: "/api/orgs",
  deleteOrg: (orgId: string) => `/api/orgs/${orgId}`,
  updateOrg: (orgId: string) => `/api/orgs/${orgId}`,
};

export const kApiAppSWRKeys = {
  getApps: (orgId: string, page?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/orgs/${orgId}/apps${queryString ? `?${queryString}` : ""}`;
  },
  getApp: (orgId: string, appId: string) => `/api/orgs/${orgId}/apps/${appId}`,
  addApp: (orgId: string) => `/api/orgs/${orgId}/apps`,
  deleteApp: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}`,
  updateApp: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}`,
};

export const kApiClientTokenSWRKeys = {
  getClientTokens: (
    orgId: string,
    appId: string,
    page?: number,
    limit?: number
  ) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/orgs/${orgId}/apps/${appId}/client-tokens${
      queryString ? `?${queryString}` : ""
    }`;
  },
  getClientToken: (orgId: string, appId: string, clientTokenId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/client-tokens/${clientTokenId}`,
  addClientToken: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/client-tokens`,
  deleteClientToken: (orgId: string, appId: string, clientTokenId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/client-tokens/${clientTokenId}`,
  updateClientToken: (orgId: string, appId: string, clientTokenId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/client-tokens/${clientTokenId}`,
  encodeClientTokenJWT: (orgId: string, appId: string, clientTokenId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/client-tokens/${clientTokenId}/encode`,
  refreshClientTokenJWT: () => `/api/client-tokens/refresh`,
};

export const kApiLogSWRKeys = {
  ingest: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/logs/ingest`,
  retrieve: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/logs/retrieve`,
  getLogFields: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/logs/fields`,
  getLogById: (orgId: string, appId: string, logId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/logs/${logId}`,
  getLogFieldValues: (
    orgId: string,
    appId: string,
    page?: number,
    limit?: number
  ) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/orgs/${orgId}/apps/${appId}/logs/fields/values${
      queryString ? `?${queryString}` : ""
    }`;
  },
};

export const kApiMonitorSWRKeys = {
  getMonitors: (
    orgId: string,
    appId: string,
    page?: number,
    limit?: number
  ) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/orgs/${orgId}/apps/${appId}/monitors${
      queryString ? `?${queryString}` : ""
    }`;
  },
  getMonitorById: (orgId: string, appId: string, monitorId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/monitors/${monitorId}`,
  addMonitor: (orgId: string, appId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/monitors`,
  deleteMonitor: (orgId: string, appId: string, monitorId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/monitors/${monitorId}`,
  updateMonitor: (orgId: string, appId: string, monitorId: string) =>
    `/api/orgs/${orgId}/apps/${appId}/monitors/${monitorId}`,
};

export const kApiMemberSWRKeys = {
  getMembers: (orgId: string, page?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/orgs/${orgId}/members${queryString ? `?${queryString}` : ""}`;
  },
  addMember: (orgId: string) => `/api/orgs/${orgId}/members`,
  getMemberByUserId: (orgId: string, memberUserId: string) =>
    `/api/orgs/${orgId}/members/user/${memberUserId}`,
  removeMemberById: (orgId: string, memberId: string) =>
    `/api/orgs/${orgId}/members/${memberId}`,
  getMemberById: (orgId: string, memberId: string) =>
    `/api/orgs/${orgId}/members/${memberId}`,
  updateMemberById: (orgId: string, memberId: string) =>
    `/api/orgs/${orgId}/members/${memberId}`,
  getUserRequests: (page?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (page) query.set("page", page.toString());
    if (limit) query.set("limit", limit.toString());
    const queryString = query.toString();
    return `/api/members/requests${queryString ? `?${queryString}` : ""}`;
  },
  respondToMemberRequest: (orgId: string, memberId: string) =>
    `/api/orgs/${orgId}/members/${memberId}/respond`,
};
