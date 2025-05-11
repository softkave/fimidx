import {
  AddAppEndpointResponse,
  addAppSchema,
  deleteAppSchema,
  GetAppsEndpointResponse,
  getAppsSchema,
} from "@/src/definitions/app";
import { kPermissions } from "@/src/definitions/permissions";
import { addApp } from "@/src/lib/serverHelpers/app/addApp";
import { deleteApp } from "@/src/lib/serverHelpers/app/deleteApp";
import { getAppList } from "@/src/lib/serverHelpers/app/getAppList";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const input = addAppSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.app.update,
  });

  const app = await addApp({ args: input, userId, orgId: params.orgId });
  const response: AddAppEndpointResponse = {
    app,
  };

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const input = getAppsSchema.parse(await req.nextUrl.searchParams);

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.app.read,
  });

  const { apps, total } = await getAppList({
    args: input,
    orgId: params.orgId,
  });

  const response: GetAppsEndpointResponse = {
    apps,
    total,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const input = deleteAppSchema.parse(await req.json());

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
