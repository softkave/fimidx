import {
  RefreshClientTokenJWTEndpointResponse,
  refreshClientTokenJWTSchema,
} from "@/src/definitions/clientToken";
import { refreshClientTokenJWT } from "@/src/lib/serverHelpers/clientToken/refreshClientTokenJWT";
import { wrapClientTokenAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, { clientToken, jwtContent }) => {
    const input = refreshClientTokenJWTSchema.parse(await req.json());

    const { refreshToken, token } = await refreshClientTokenJWT({
      id: clientToken.id,
      refreshToken: input.refreshToken,
      jwtContent,
    });

    const response: RefreshClientTokenJWTEndpointResponse = {
      refreshToken,
      token,
    };

    return response;
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
