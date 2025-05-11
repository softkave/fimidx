import {
  AddOrgEndpointResponse,
  addOrgSchema,
  GetOrgsEndpointResponse,
  getOrgsSchema,
} from "@/src/definitions/org";
import { addOrg } from "@/src/lib/serverHelpers/org/addOrg";
import { getOrgList } from "@/src/lib/serverHelpers/org/getOrgList";
import { wrapAuthenticated } from "@/src/lib/serverHelpers/wrapAuthenticated.ts";
import { IRouteContext } from "@/src/lib/serverHelpers/wrapRoute.ts";
import { NextRequest } from "next/server";
import { AnyFn } from "softkave-js-utils";

const postEndpointFn = wrapAuthenticated(
  async (req, res, { userId, email, user }) => {
    const input = addOrgSchema.parse(await req.json());
    const org = await addOrg({
      args: input,
      userId,
      userEmail: email,
      userName: user?.name ?? "Unknown User",
    });

    const response: AddOrgEndpointResponse = {
      org,
    };

    return response;
  }
);

export const POST = postEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;

const getEndpointFn = wrapAuthenticated(async (req, ctx, { userId }) => {
  const input = getOrgsSchema.parse(await req.nextUrl.searchParams);
  const { orgs, total } = await getOrgList({ args: input, userId });
  const response: GetOrgsEndpointResponse = {
    orgs,
    total,
  };

  return response;
});

export const GET = getEndpointFn as unknown as AnyFn<
  [NextRequest, IRouteContext],
  Promise<void | Response>
>;
