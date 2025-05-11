import {
  getMemberByIdSchema,
  IGetMemberEndpointResponse,
  IUpdateMemberEndpointResponse,
  updateMemberSchema,
} from "@/src/definitions/members";
import { kPermissions } from "@/src/definitions/permissions";
import { augmentMembers } from "@/src/lib/serverHelpers/member/augmentMembers";
import { getMember } from "@/src/lib/serverHelpers/member/getMember";
import { deleteMemberById } from "@/src/lib/serverHelpers/member/removeMember";
import { updateMemberById } from "@/src/lib/serverHelpers/member/updateMember";
import {
  checkPermission,
  hasPermission,
} from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    memberId: string;
    orgId: string;
  };
  const input = getMemberByIdSchema.parse({
    id: params.memberId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.member.read,
  });

  const member = await getMember({ id: input.id, orgId: params.orgId });
  const [augmentedMember] = await augmentMembers(
    [member],
    await hasPermission({
      userId,
      orgId: params.orgId,
      permission: kPermissions.member.readPermissions,
    })
  );
  const response: IGetMemberEndpointResponse = {
    member: augmentedMember,
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
    memberId: string;
  };
  const input = getMemberByIdSchema.parse({
    id: params.memberId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.member.remove,
  });

  await deleteMemberById({ id: input.id, orgId: params.orgId });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    orgId: string;
    memberId: string;
  };
  const memberUpdateInput = updateMemberSchema.parse(await req.json());
  const memberInput = getMemberByIdSchema.parse({
    id: params.memberId,
  });

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.member.update,
  });

  const updatedMember = await updateMemberById({
    id: memberInput.id,
    args: memberUpdateInput,
    orgId: params.orgId,
    updatedBy: userId,
  });

  const [augmentedMember] = await augmentMembers(
    [updatedMember],
    await hasPermission({
      userId,
      orgId: params.orgId,
      permission: kPermissions.member.readPermissions,
    })
  );
  const response: IUpdateMemberEndpointResponse = {
    member: augmentedMember,
  };

  return response;
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
