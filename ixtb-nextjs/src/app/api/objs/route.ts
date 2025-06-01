import { deleteManyObjsEndpoint } from "@/src/lib/endpoints/objs/deleteManyObjsEndpoint";
import { setManyObjsEndpoint } from "@/src/lib/endpoints/objs/setManyObjsEndpoint";
import { updateManyObjsEndpoint } from "@/src/lib/endpoints/objs/updateManyObjsEndpoint";
import { wrapClientTokenAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return setManyObjsEndpoint({ req, ctx, session });
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const patchEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return updateManyObjsEndpoint({ req, ctx, session });
  }
);

export const PATCH = patchEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const deleteEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return deleteManyObjsEndpoint({ req, ctx, session });
  }
);

export const DELETE = deleteEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
