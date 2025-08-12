import { retrieveLogsEndpoint } from "@/src/lib/endpoints/external/logs/retrieveLogsEndpoint";
import { wrapMaybeAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapMaybeAuthenticated(async (req, ctx, session) => {
  return retrieveLogsEndpoint({ req, ctx, session });
});

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
