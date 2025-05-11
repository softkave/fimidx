import {
  AddClientTokenEndpointResponse,
  addClientTokenSchema,
  deleteClientTokenSchema,
  GetClientTokensEndpointResponse,
  getClientTokensSchema,
} from "@/src/definitions/clientToken";
import { kPermissions } from "@/src/definitions/permissions";
import { addClientToken } from "@/src/lib/serverHelpers/clientToken/addClientToken";
import { deleteClientToken } from "@/src/lib/serverHelpers/clientToken/deleteClientToken";
import { getClientTokenList } from "@/src/lib/serverHelpers/clientToken/getClientTokenList";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; appId: string };
  const input = addClientTokenSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.clientToken.update,
  });

  const clientToken = await addClientToken({
    args: input,
    userId,
    orgId: params.orgId,
    appId: params.appId,
  });

  const response: AddClientTokenEndpointResponse = {
    clientToken,
  };

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; appId: string };
  const input = getClientTokensSchema.parse(await req.nextUrl.searchParams);

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.clientToken.read,
  });
  const { clientTokens, total } = await getClientTokenList({
    args: input,
    appId: params.appId,
    orgId: params.orgId,
  });

  const response: GetClientTokensEndpointResponse = {
    clientTokens,
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
  const input = deleteClientTokenSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.clientToken.delete,
  });

  await deleteClientToken({
    id: input.id,
    orgId: params.orgId,
    appId: params.appId,
  });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
