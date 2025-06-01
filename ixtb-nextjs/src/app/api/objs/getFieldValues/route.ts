import { getObjFieldsEndpoint } from "@/src/lib/endpoints/objs/getObjFieldsEndpoint";
import { wrapClientTokenAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return getObjFieldsEndpoint({ req, ctx, session });
  }
);

export const POST = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
