import { encodeClientTokenEndpoint } from "@/src/lib/endpoints/external/clientTokens/encodeClientTokenEndpoint";
import { wrapMaybeAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapMaybeAuthenticated(async (req, ctx, session) => {
  return encodeClientTokenEndpoint({ req, ctx, session });
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
