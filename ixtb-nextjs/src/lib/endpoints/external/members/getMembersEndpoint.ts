import {
  IGetMembersEndpointResponse,
  getMembersSchema,
} from "fmdx-core/definitions/member";
import { getMembers } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const getMembersEndpoint: NextClientTokenAuthenticatedEndpointFn<
  IGetMembersEndpointResponse
> = async (params) => {
  const { req } = params;

  const input = getMembersSchema.parse(await req.json());
  const { members, hasMore, page, limit } = await getMembers({
    args: input,
  });

  const response: IGetMembersEndpointResponse = {
    members,
    hasMore,
    page,
    limit,
  };

  return response;
};
