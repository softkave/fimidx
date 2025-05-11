import {
  GetOrgEndpointResponse,
  getOrgSchema,
  UpdateOrgEndpointResponse,
  updateOrgSchema,
} from "@/src/definitions/org";
import { kPermissions } from "@/src/definitions/permissions";
import { hasMemberInvitation } from "@/src/lib/serverHelpers/member/getMemberInvitation";
import { deleteOrg } from "@/src/lib/serverHelpers/org/deleteOrg";
import { getOrg } from "@/src/lib/serverHelpers/org/getOrg";
import { updateOrg } from "@/src/lib/serverHelpers/org/updateOrg";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const input = getOrgSchema.parse({
    id: params.orgId,
  });

  await hasMemberInvitation({ userId, orgId: input.id });

  const org = await getOrg({ id: input.id });
  const response: GetOrgEndpointResponse = {
    org,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const input = getOrgSchema.parse({
    id: params.orgId,
  });

  await checkPermission({
    userId,
    orgId: input.id,
    permission: kPermissions.org.delete,
  });

  await deleteOrg({ id: input.id });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const orgUpdateInput = updateOrgSchema.parse(await req.json());
  const orgInput = getOrgSchema.parse({
    id: params.orgId,
  });

  await checkPermission({
    userId,
    orgId: orgInput.id,
    permission: kPermissions.org.update,
  });

  const updatedOrg = await updateOrg({
    id: orgInput.id,
    args: orgUpdateInput,
    userId,
  });

  const response: UpdateOrgEndpointResponse = {
    org: updatedOrg,
  };

  return response;
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
