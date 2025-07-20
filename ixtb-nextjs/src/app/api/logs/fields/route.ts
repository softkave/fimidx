import { getLogFieldsEndpoint } from "@/src/lib/endpoints/external/logs/getLogFieldsEndpoint";
import { wrapMaybeAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapMaybeAuthenticated(async (req, ctx, session) => {
  return getLogFieldsEndpoint({ req, ctx, session });
});

export const POST = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
