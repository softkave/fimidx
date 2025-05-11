import {
  createMonitorSchema,
  deleteMonitorSchema,
  getMonitorsSchema,
  ICreateMonitorEndpointResponse,
  IGetMonitorsEndpointResponse,
} from "@/src/definitions/monitor";
import { kPermissions } from "@/src/definitions/permissions";
import { addMonitor } from "@/src/lib/serverHelpers/monitor/addMonitor";
import { deleteMonitor } from "@/src/lib/serverHelpers/monitor/deleteMonitor";
import { getMonitorList } from "@/src/lib/serverHelpers/monitor/getMonitors";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; appId: string };
  const input = createMonitorSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.monitor.update,
  });

  const monitor = await addMonitor({
    args: input,
    userId,
    orgId: params.orgId,
    appId: params.appId,
  });

  const response: ICreateMonitorEndpointResponse = {
    monitor,
  };

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; appId: string };
  const input = getMonitorsSchema.parse(await req.nextUrl.searchParams);

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.monitor.read,
  });

  const { monitors, total } = await getMonitorList({
    args: input,
    orgId: params.orgId,
    appId: params.appId,
  });

  const response: IGetMonitorsEndpointResponse = {
    monitors,
    total,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; appId: string };
  const input = deleteMonitorSchema.parse(await req.json());

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
