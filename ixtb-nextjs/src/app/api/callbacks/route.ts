import { addCallbackEndpoint } from "@/src/lib/endpoints/callbacks/addCallbackEndpoint";
import { deleteCallbackEndpoint } from "@/src/lib/endpoints/callbacks/deleteCallbackEndpoint";
import { wrapClientTokenAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return addCallbackEndpoint({ req, ctx, session });
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return deleteCallbackEndpoint({ req, ctx, session });
  }
);

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
