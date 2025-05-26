import { GetAppsEndpointArgs } from "fmdx-core/definitions/app";
import {
  GetCallbackEndpointArgs,
  GetCallbacksEndpointArgs,
} from "fmdx-core/definitions/callback";
import { GetClientTokensEndpointArgs } from "fmdx-core/definitions/clientToken";
import {
  GetLogFieldsEndpointArgs,
  GetLogFieldValuesEndpointArgs,
  GetLogsEndpointArgs,
} from "fmdx-core/definitions/log";
import {
  GetMemberByUserIdEndpointArgs,
  GetMembersEndpointArgs,
  GetUserRequestsEndpointArgs,
} from "fmdx-core/definitions/members";
import { GetMonitorsEndpointArgs } from "fmdx-core/definitions/monitor";
import { GetOrgsEndpointArgs } from "fmdx-core/definitions/org";
import {
  kApiAppKeys,
  kApiCallbackKeys,
  kApiClientTokenKeys,
  kApiLogKeys,
  kApiMemberKeys,
  kApiMonitorKeys,
  kApiOrgKeys,
} from "./apikeys";

export const kOrgSWRKeys = {
  getOrgs: (params: GetOrgsEndpointArgs) =>
    [kApiOrgKeys.getOrgs(), params] as const,
  getOrg: (orgId: string) => kApiOrgKeys.getOrg(orgId),
  addOrg: () => kApiOrgKeys.addOrg(),
  deleteOrg: () => kApiOrgKeys.deleteOrg(),
  updateOrg: (orgId: string) => kApiOrgKeys.updateOrg(orgId),
};

export const kAppSWRKeys = {
  getApps: (params: GetAppsEndpointArgs) =>
    [kApiAppKeys.getApps(), params] as const,
  getApp: (appId: string) => kApiAppKeys.getApp(appId),
  addApp: () => kApiAppKeys.addApp(),
  deleteApp: () => kApiAppKeys.deleteApp(),
  updateApp: (appId: string) => kApiAppKeys.updateApp(appId),
};

export const kClientTokenSWRKeys = {
  getClientTokens: (params: GetClientTokensEndpointArgs) =>
    [kApiClientTokenKeys.getClientTokens(), params] as const,
  getClientToken: (clientTokenId: string) =>
    kApiClientTokenKeys.getClientToken(clientTokenId),
  addClientToken: () => kApiClientTokenKeys.addClientToken(),
  deleteClientToken: () => kApiClientTokenKeys.deleteClientToken(),
  updateClientToken: (clientTokenId: string) =>
    kApiClientTokenKeys.updateClientToken(clientTokenId),
  encodeClientTokenJWT: (clientTokenId: string) =>
    kApiClientTokenKeys.encodeClientTokenJWT(clientTokenId),
  refreshClientTokenJWT: () => kApiClientTokenKeys.refreshClientTokenJWT(),
};

export const kLogSWRKeys = {
  ingest: () => kApiLogKeys.ingest(),
  retrieve: (params: GetLogsEndpointArgs) =>
    [kApiLogKeys.retrieve(), params] as const,
  getLogFields: (params: GetLogFieldsEndpointArgs) =>
    [kApiLogKeys.getLogFields(), params] as const,
  getLogById: (logId: string) => kApiLogKeys.getLogById(logId),
  getLogFieldValues: (params: GetLogFieldValuesEndpointArgs) =>
    [kApiLogKeys.getLogFieldValues(), params] as const,
};

export const kMonitorSWRKeys = {
  getMonitors: (params: GetMonitorsEndpointArgs) =>
    [kApiMonitorKeys.getMonitors(), params] as const,
  getMonitorById: (monitorId: string) =>
    kApiMonitorKeys.getMonitorById(monitorId),
  addMonitor: () => kApiMonitorKeys.addMonitor(),
  deleteMonitor: () => kApiMonitorKeys.deleteMonitor(),
  updateMonitor: (monitorId: string) =>
    kApiMonitorKeys.updateMonitor(monitorId),
};

export const kMemberSWRKeys = {
  getMembers: (params: GetMembersEndpointArgs) =>
    [kApiMemberKeys.getMembers(), params] as const,
  addMember: () => kApiMemberKeys.addMember(),
  getMemberByUserId: (params: GetMemberByUserIdEndpointArgs) =>
    [kApiMemberKeys.getMemberByUserId(params.userId), params] as const,
  removeMember: () => kApiMemberKeys.removeMember(),
  getMemberById: (memberId: string) => kApiMemberKeys.getMemberById(memberId),
  updateMemberById: (memberId: string) =>
    kApiMemberKeys.updateMemberById(memberId),
  getUserRequests: (params: GetUserRequestsEndpointArgs) =>
    [kApiMemberKeys.getUserRequests(), params] as const,
  respondToMemberRequest: (memberId: string) =>
    kApiMemberKeys.respondToMemberRequest(memberId),
};

export const kCallbackSWRKeys = {
  getCallbacks: (params: GetCallbacksEndpointArgs) =>
    [kApiCallbackKeys.getCallbacks(), params] as const,
  addCallback: () => kApiCallbackKeys.addCallback(),
  getCallback: (params: GetCallbackEndpointArgs) =>
    [kApiCallbackKeys.getCallback(), params] as const,
  deleteCallback: () => kApiCallbackKeys.deleteCallback(),
  updateCallback: (callbackId: string) =>
    kApiCallbackKeys.updateCallback(callbackId),
};
