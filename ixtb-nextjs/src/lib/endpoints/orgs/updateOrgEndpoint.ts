import {
  getGroupSchema,
  kPermissions,
  UpdateGroupEndpointResponse,
  updateGroupSchema,
} from "fmdx-core/definitions/index";
import { updateGroup } from "fmdx-core/serverHelpers/index";
import { checkPermission } from "fmdx-core/serverHelpers/permission";
import { NextUserAuthenticatedEndpointFn } from "../types";

export const updateGroupEndpoint: NextUserAuthenticatedEndpointFn<
  UpdateGroupEndpointResponse
> = async (params) => {
  const {
    req,
    ctx,
    session: { userId },
  } = params;
  const pathParams = (await ctx.params) as { groupId: string };
  const groupUpdateInput = updateGroupSchema.parse(await req.json());
  const groupInput = getGroupSchema.parse({
    id: pathParams.groupId,
  });

  await checkPermission({
    userId,
    groupId: groupInput.id,
    permission: kPermissions.group.update,
  });

  const updatedGroup = await updateGroup({
    id: groupInput.id,
    args: groupUpdateInput,
    userId,
  });

  const response: UpdateGroupEndpointResponse = {
    group: updatedGroup,
  };

  return response;
};
