import type { UpdateClientTokensEndpointArgs } from "../../definitions/clientToken.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { addClientTokenPermissions } from "./addClientTokenPermissions.js";
import { getClientTokens, getClientTokensObjQuery } from "./getClientTokens.js";

export async function updateClientTokens(params: {
  args: UpdateClientTokensEndpointArgs;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, by, byType, storage } = params;
  const { update, updateMany } = args;

  // Extract permissions from update to handle separately
  const { permissions, ...otherUpdates } = update;

  const objQuery = getClientTokensObjQuery({ args });

  // Use merge strategy for partial updates, but handle meta field specially
  // The meta field will be completely replaced when present in the update
  await updateManyObjs({
    objQuery,
    tag: kObjTags.clientToken,
    by,
    byType,
    update: otherUpdates,
    count: updateMany ? undefined : 1,
    updateWay: "merge",
    storage,
  });

  // Handle permissions separately if provided
  if (permissions) {
    const { clientTokens } = await getClientTokens({
      args: {
        query: args.query,
      },
      includePermissions: false,
      storage,
    });

    // Add permissions for each client token
    for (const clientToken of clientTokens) {
      await addClientTokenPermissions({
        by,
        byType,
        groupId: clientToken.groupId,
        appId: clientToken.appId,
        permissions,
        clientTokenId: clientToken.id,
        storage,
      });
    }
  }
}
