import {
  getMemberByUserIdSchema,
  IGetMemberEndpointResponse,
} from "@/src/definitions/members";
import { kPermissions } from "@/src/definitions/permissions";
import { OwnServerError } from "@/src/lib/common/error";
import { augmentMembers } from "@/src/lib/serverHelpers/member/augmentMembers";
import { getMember } from "@/src/lib/serverHelpers/member/getMember";
import { hasPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    memberUserId: string;
    orgId: string;
  };
  const input = getMemberByUserIdSchema.parse({
    userId: params.memberUserId,
  });

  const hasReadMemberPermission =
    input.userId === userId ||
    (await hasPermission({
      userId,
      orgId: params.orgId,
      permission: kPermissions.member.read,
    }));

  if (!hasReadMemberPermission) {
    throw new OwnServerError("Access denied", 403);
  }

  const member = await getMember({ userId: input.userId, orgId: params.orgId });
  const [augmentedMember] = await augmentMembers(
    [member],
    hasReadMemberPermission
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
