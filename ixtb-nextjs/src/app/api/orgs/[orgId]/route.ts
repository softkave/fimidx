import { getGroupEndpoint } from "@/src/lib/endpoints/groups/getGroupEndpoint";
import { updateGroupEndpoint } from "@/src/lib/endpoints/groups/updateGroupEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return getGroupEndpoint({ req, ctx, session });
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return updateGroupEndpoint({ req, ctx, session });
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
