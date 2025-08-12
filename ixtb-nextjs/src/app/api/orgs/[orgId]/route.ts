import { deleteOrgEndpoint } from "@/src/lib/endpoints/internal/orgs/deleteOrgEndpoint";
import { getOrgEndpoint } from "@/src/lib/endpoints/internal/orgs/getOrgEndpoint";
import { updateOrgEndpoint } from "@/src/lib/endpoints/internal/orgs/updateOrgEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return getOrgEndpoint({ req, ctx, session });
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return updateOrgEndpoint({ req, ctx, session });
});

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  await deleteOrgEndpoint({ req, ctx, session });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
