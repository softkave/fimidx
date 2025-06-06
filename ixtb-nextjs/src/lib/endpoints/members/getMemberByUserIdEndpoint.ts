import { OwnServerError } from "fmdx-core/common/error";
import {
  getMemberByUserIdSchema,
  IGetMemberEndpointResponse,
} from "fmdx-core/definitions/members";
import { kPermissions } from "fmdx-core/definitions/permissions";
import { augmentMembers, getMember } from "fmdx-core/serverHelpers/index";
import { hasPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const getMemberByUserIdEndpoint: NextUserAuthenticatedEndpointFn<
  IGetMemberEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as {
    userId: string;
  };
  const input = getMemberByUserIdSchema.parse({
    userId: pathParams.userId,
    ...(await req.json()),
  });

  const hasReadMemberPermission =
    input.userId === userId ||
    (await hasPermission({
      userId,
      groupId: input.groupId,
      permission: kPermissions.member.read,
    }));

  if (!hasReadMemberPermission) {
    throw new OwnServerError("Access denied", 403);
  }

  const member = await getMember({
    userId: input.userId,
    groupId: input.groupId,
  });
  const [augmentedMember] = await augmentMembers(
    [member],
    hasReadMemberPermission
  );

  const response: IGetMemberEndpointResponse = {
    member: augmentedMember,
  };

  return response;
};
