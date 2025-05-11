import {
  EncodeClientTokenJWTEndpointResponse,
  encodeClientTokenJWTSchema,
} from "@/src/definitions/clientToken";
import { kPermissions } from "@/src/definitions/permissions";
import { encodeClientTokenJWT } from "@/src/lib/serverHelpers/clientToken/encodeClientTokenJWT";
import { checkPermission } from "@/src/lib/serverHelpers/permission";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const params = (await ctx.params) as {
    clientTokenId: string;
    orgId: string;
    appId: string;
  };
  const input = encodeClientTokenJWTSchema.parse(await req.json());

  await checkPermission({
    userId,
    orgId: params.orgId,
    permission: kPermissions.clientToken.read,
  });

  const { refreshToken, token } = await encodeClientTokenJWT({
    id: params.clientTokenId,
    orgId: params.orgId,
    appId: params.appId,
    args: input,
  });

  const response: EncodeClientTokenJWTEndpointResponse = {
    refreshToken,
    token,
  };

  return response;
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
