import { GetOrgsEndpointArgs } from "@/src/definitions/org";
import { GetAppsEndpointArgs } from "fmdx-core/definitions/app";
import { GetCallbacksEndpointArgs } from "fmdx-core/definitions/callback";
import { GetClientTokensEndpointArgs } from "fmdx-core/definitions/clientToken";
import { GetGroupsEndpointArgs } from "fmdx-core/definitions/group";
import {
  GetLogFieldsEndpointArgs,
  GetLogsEndpointArgs,
} from "fmdx-core/definitions/log";
import {
  GetMemberRequestsEndpointArgs,
  GetMembersEndpointArgs,
} from "fmdx-core/definitions/member";
import { GetMonitorsEndpointArgs } from "fmdx-core/definitions/monitor";
import {
  kApiAppKeys,
  kApiCallbackKeys,
  kApiClientTokenKeys,
  kApiGroupKeys,
  kApiLogKeys,
  kApiMemberKeys,
  kApiMonitorKeys,
  kApiOrgKeys,
} from "./apikeys";

export const kGroupSWRKeys = {
  getGroups: (params: GetGroupsEndpointArgs) =>
    [kApiGroupKeys.getGroups(), params] as const,
  getGroup: (groupId: string) => kApiGroupKeys.getGroup(groupId),
  addGroup: () => kApiGroupKeys.addGroup(),
  deleteGroup: () => kApiGroupKeys.deleteGroup(),
  updateGroup: (groupId: string) => kApiGroupKeys.updateGroup(groupId),
};

export const kOrgSWRKeys = {
  getOrgs: (params: GetOrgsEndpointArgs) =>
    [kApiOrgKeys.getOrgs(), params] as const,
  getOrg: (orgId: string) => kApiOrgKeys.getOrg(orgId),
  addOrg: () => kApiOrgKeys.addOrg(),
  deleteOrg: (orgId: string) => kApiOrgKeys.deleteOrg(orgId),
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
  removeMember: () => kApiMemberKeys.removeMember(),
  getMemberById: (memberId: string) => kApiMemberKeys.getMemberById(memberId),
  updateMemberById: (memberId: string) =>
    kApiMemberKeys.updateMemberById(memberId),
  getMemberRequests: (params: GetMemberRequestsEndpointArgs) =>
    [kApiMemberKeys.getMemberRequests(), params] as const,
  respondToMemberRequest: (memberId: string) =>
    kApiMemberKeys.respondToMemberRequest(memberId),
};

export const kCallbackSWRKeys = {
  getCallbacks: (params: GetCallbacksEndpointArgs) =>
    [kApiCallbackKeys.getCallbacks(), params] as const,
  addCallback: () => kApiCallbackKeys.addCallback(),
  getCallback: (callbackId: string) => kApiCallbackKeys.getCallback(callbackId),
  deleteCallback: () => kApiCallbackKeys.deleteCallback(),
  updateCallback: (callbackId: string) =>
    kApiCallbackKeys.updateCallback(callbackId),
};
