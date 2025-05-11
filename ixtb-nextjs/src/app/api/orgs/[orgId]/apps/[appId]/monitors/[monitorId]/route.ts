import {
  deleteMonitorSchema,
  getMonitorByIdSchema,
  IGetMonitorByIdEndpointResponse,
  IUpdateMonitorEndpointResponse,
  updateMonitorSchema,
} from "@/src/definitions/monitor";
import { kPermissions } from "@/src/definitions/permissions";
import { deleteMonitor } from "@/src/lib/serverHelpers/monitor/deleteMonitor";
import { getMonitor } from "@/src/lib/serverHelpers/monitor/getMonitor";
import { updateMonitor } from "@/src/lib/serverHelpers/monitor/updateMonitor";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
    monitorId: string;
  };
  const input = getMonitorByIdSchema.parse({
    id: params.monitorId,
    orgId: params.orgId,
    appId: params.appId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.monitor.read,
  });

  const monitor = await getMonitor({
    id: input.id,
    orgId: params.orgId,
    appId: params.appId,
  });

  const response: IGetMonitorByIdEndpointResponse = {
    monitor,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
    monitorId: string;
  };
  const input = deleteMonitorSchema.parse({
    id: params.monitorId,
    orgId: params.orgId,
    appId: params.appId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.monitor.delete,
  });

  await deleteMonitor({
    id: input.id,
    orgId: params.orgId,
    appId: params.appId,
  });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
    monitorId: string;
  };

  const monitorUpdateInput = updateMonitorSchema.parse(await req.json());
  const monitorInput = getMonitorByIdSchema.parse({
    id: params.monitorId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.monitor.update,
  });

  const updatedMonitor = await updateMonitor({
    id: monitorInput.id,
    args: monitorUpdateInput,
    orgId: params.orgId,
    appId: params.appId,
    userId,
  });

  const response: IUpdateMonitorEndpointResponse = {
    monitor: updatedMonitor,
  };

  return response;
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
