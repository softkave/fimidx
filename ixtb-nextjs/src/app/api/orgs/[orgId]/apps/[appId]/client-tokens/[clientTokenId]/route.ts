import {
  GetClientTokenEndpointResponse,
  getClientTokenSchema,
  UpdateClientTokenEndpointResponse,
  updateClientTokenSchema,
} from "@/src/definitions/clientToken";
import { kPermissions } from "@/src/definitions/permissions";
import { deleteClientToken } from "@/src/lib/serverHelpers/clientToken/deleteClientToken";
import { getClientToken } from "@/src/lib/serverHelpers/clientToken/getClientToken";
import { updateClientToken } from "@/src/lib/serverHelpers/clientToken/updateClientToken";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    clientTokenId: string;
    orgId: string;
    appId: string;
  };

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.clientToken.read,
  });
  const input = getClientTokenSchema.parse({
    id: params.clientTokenId,
  });

  const clientToken = await getClientToken({
    id: input.id,
    orgId: params.orgId,
    appId: params.appId,
  });
  const response: GetClientTokenEndpointResponse = {
    clientToken,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    clientTokenId: string;
    orgId: string;
    appId: string;
  };
  const input = getClientTokenSchema.parse({
    id: params.clientTokenId,
  });

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

const patchEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    clientTokenId: string;
    orgId: string;
    appId: string;
  };
  const clientTokenUpdateInput = updateClientTokenSchema.parse(
    await req.json()
  );
  const clientTokenInput = getClientTokenSchema.parse({
    id: params.clientTokenId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.clientToken.update,
  });

  const updatedClientToken = await updateClientToken({
    id: clientTokenInput.id,
    args: clientTokenUpdateInput,
    orgId: params.orgId,
    appId: params.appId,
    userId,
  });

  const response: UpdateClientTokenEndpointResponse = {
    clientToken: updatedClientToken,
  };

  return response;
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
