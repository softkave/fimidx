import {
  respondToMemberRequestSchema,
  type IRespondToMemberRequestEndpointResponse,
} from "@/src/definitions/members";
import { augmentUserRequests } from "@/src/lib/serverHelpers/member/augmentUserRequests";
import { respondToMemberRequest } from "@/src/lib/serverHelpers/member/respondToMemberRequest";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as { orgId: string; requestId: string };
  const input = respondToMemberRequestSchema.parse(await req.json());

  const member = await respondToMemberRequest({
    id: params.requestId,
    args: {
      status: input.status,
    },
    userId,
    orgId: params.orgId,
  });

  const augmentedMember = await augmentUserRequests({
    requests: [member],
  });

  const response: IRespondToMemberRequestEndpointResponse = {
    member: augmentedMember[0],
  };

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
