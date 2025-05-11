import {
  GetAppEndpointResponse,
  getAppSchema,
  UpdateAppEndpointResponse,
  updateAppSchema,
} from "@/src/definitions/app";
import { kPermissions } from "@/src/definitions/permissions";
import { deleteApp } from "@/src/lib/serverHelpers/app/deleteApp";
import { getApp } from "@/src/lib/serverHelpers/app/getApp";
import { updateApp } from "@/src/lib/serverHelpers/app/updateApp";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    appId: string;
    orgId: string;
  };
  const input = getAppSchema.parse({
    id: params.appId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.app.read,
  });

  const app = await getApp({ id: input.id, orgId: params.orgId });
  const response: GetAppEndpointResponse = {
    app,
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
  };
  const input = getAppSchema.parse({
    id: params.appId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.app.delete,
  });

  await deleteApp({ id: input.id, orgId: params.orgId });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    appId: string;
  };
  const appUpdateInput = updateAppSchema.parse(await req.json());
  const appInput = getAppSchema.parse({
    id: params.appId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.app.update,
  });

  const updatedApp = await updateApp({
    id: appInput.id,
    args: appUpdateInput,
    orgId: params.orgId,
    userId,
  });

  const response: UpdateAppEndpointResponse = {
    app: updatedApp,
  };

  return response;
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
