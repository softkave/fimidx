import { getUserRequestsEndpoint } from "@/src/lib/endpoints/members/getUserRequestsEndpoint";
import { wrapUserAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";

export const POST = wrapUserAuthenticated(async (req, ctx, session) => {
  return getUserRequestsEndpoint({ req, ctx, session });
});
