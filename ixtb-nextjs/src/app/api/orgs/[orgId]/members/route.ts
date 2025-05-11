import {
  addMemberSchema,
  getMembersSchema,
  IAddMemberEndpointResponse,
  IGetMembersEndpointResponse,
} from "@/src/definitions/members";
import { kPermissions } from "@/src/definitions/permissions";
import { addMember } from "@/src/lib/serverHelpers/member/addMember";
import { augmentMembers } from "@/src/lib/serverHelpers/member/augmentMembers";
import { getOrgMemberList } from "@/src/lib/serverHelpers/member/getMembers";
import {
  checkPermission,
  hasPermission,
} from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(
  async (req, ctx, { userId, user, email }) => {
    const params = (await ctx.params) as { orgId: string };
    const input = addMemberSchema.parse(await req.json());

    await checkPermission({
      userId,
      orgId: params.orgId,
      permission: kPermissions.member.invite,
    });

    const member = await addMember({
      args: input,
      inviterId: userId,
      orgId: params.orgId,
      inviterName: user?.name ?? email,
    });

    const augmentedMember = await augmentMembers(
      [member],
      await hasPermission({
        userId,
        orgId: params.orgId,
        permission: kPermissions.member.readPermissions,
      })
    );

    const response: IAddMemberEndpointResponse = {
      member: augmentedMember[0],
    };

    return response;
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string };
  const input = getMembersSchema.parse(await req.nextUrl.searchParams);

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.member.read,
  });

  const { members, total } = await getOrgMemberList({
    args: input,
    orgId: params.orgId,
  });

  const augmentedMembers = await augmentMembers(
    members,
    await hasPermission({
      userId,
      orgId: params.orgId,
      permission: kPermissions.member.readPermissions,
    })
  );

  const response: IGetMembersEndpointResponse = {
    members: augmentedMembers,
    total,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
