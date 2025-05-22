import { addOrgEndpoint } from "@/src/lib/endpoints/orgs/addOrgEndpoint";
import { deleteOrgEndpoint } from "@/src/lib/endpoints/orgs/deleteOrgEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return addOrgEndpoint({ req, ctx, session });
});

export const POST = postEndpointFn as unknown as AnyFn<
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
