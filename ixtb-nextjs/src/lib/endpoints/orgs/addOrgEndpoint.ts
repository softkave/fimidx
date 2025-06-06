import {
  AddGroupEndpointResponse,
  addGroupSchema,
  kMemberStatus,
  kPermissions,
} from "fmdx-core/definitions/index";
import { addGroup, addMember } from "fmdx-core/serverHelpers/index";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const addGroupEndpoint: NextUserAuthenticatedEndpointFn<
  AddGroupEndpointResponse
> = async (params) => {
  const {
    req,
    session: { userId, email, user },
  } = params;
  const input = addGroupSchema.parse(await req.json());
  const group = await addGroup({
    args: input,
    userId,
  });

  await addMember({
    args: {
      email: user?.email ?? email,
      permissions: [kPermissions.wildcard],
      groupId: group.id,
    },
    inviterId: userId,
    groupId: group.id,
    status: kMemberStatus.accepted,
  });

  const response: AddGroupEndpointResponse = {
    group,
  };

  return response;
};
