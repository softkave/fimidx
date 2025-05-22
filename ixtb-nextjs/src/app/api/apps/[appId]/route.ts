import { getAppEndpoint } from "@/src/lib/endpoints/apps/getAppEndpoint";
import { updateAppEndpoint } from "@/src/lib/endpoints/apps/updateAppEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return getAppEndpoint({ req, ctx, session });
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return updateAppEndpoint({ req, ctx, session });
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
