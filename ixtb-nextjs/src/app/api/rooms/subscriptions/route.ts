import { addRoomSubscriptionEndpoint } from "@/src/lib/endpoints/rooms/addRoomSubscriptionEndpoint";
import { wrapClientTokenAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapClientTokenAuthenticated(
  async (req, ctx, session) => {
    return addRoomSubscriptionEndpoint({ req, ctx, session });
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
