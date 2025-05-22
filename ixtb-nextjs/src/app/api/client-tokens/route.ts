import { addClientTokenEndpoint } from "@/src/lib/endpoints/clientTokens/addClientTokenEndpoint";
import { deleteClientTokenEndpoint } from "@/src/lib/endpoints/clientTokens/deleteClientTokenEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return addClientTokenEndpoint({ req, ctx, session: session });
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return deleteClientTokenEndpoint({ req, ctx, session });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
