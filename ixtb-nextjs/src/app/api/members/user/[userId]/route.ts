import { getMemberByUserIdEndpoint } from "@/src/lib/endpoints/members/getMemberByUserIdEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return getMemberByUserIdEndpoint({ req, ctx, session });
});

export const POST = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
