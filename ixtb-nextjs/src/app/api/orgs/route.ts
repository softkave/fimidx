import { addGroupEndpoint } from "@/src/lib/endpoints/groups/addGroupEndpoint";
import { deleteGroupEndpoint } from "@/src/lib/endpoints/groups/deleteGroupEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return addGroupEndpoint({ req, ctx, session });
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  await deleteGroupEndpoint({ req, ctx, session });
});

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
