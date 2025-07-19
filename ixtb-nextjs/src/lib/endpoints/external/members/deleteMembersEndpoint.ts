import { deleteMembersSchema, kByTypes } from "fmdx-core/definitions/index";
import { deleteMembers } from "fmdx-core/serverHelpers/index";
import { NextClientTokenAuthenticatedEndpointFn } from "../../types";

export const deleteMemberEndpoint: NextClientTokenAuthenticatedEndpointFn<
  void
> = async (params) => {
  const {
    req,
    session: { clientToken },
  } = params;

  const input = deleteMembersSchema.parse(await req.json());
  await deleteMembers({
    by: clientToken.id,
    byType: kByTypes.clientToken,
    query: input.query,
    deleteMany: input.deleteMany,
  });
};
