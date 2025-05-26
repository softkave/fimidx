import {
  AddOrgEndpointResponse,
  addOrgSchema,
  kMemberStatus,
  kPermissions,
} from "fmdx-core/definitions/index";
import { addMember, addOrg } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const addOrgEndpoint: NextUserAuthenticatedEndpointFn<
  AddOrgEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId, email, user },
  } = params;
  const input = addOrgSchema.parse(await req.json());
  const org = await addOrg({
    args: input,
    userId,
  });

  await addMember({
    args: {
      email: user?.email ?? email,
      permissions: [kPermissions.wildcard],
      orgId: org.id,
    },
    inviterId: userId,
    orgId: org.id,
    status: kMemberStatus.accepted,
  });

  const response: AddOrgEndpointResponse = {
    org,
  };

  return response;
};
