import { getLogFieldsEndpoint } from "@/src/lib/endpoints/logs/getLogFieldsEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const getEndpointFn = wrapUserAuthenticated(async (req, ctx, session) => {
  return getLogFieldsEndpoint({ req, ctx, session });
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
