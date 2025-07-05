import type { UpdateAppsEndpointArgs } from "../../definitions/app.js";
import { kObjTags } from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { updateManyObjs } from "../obj/updateObjs.js";
import { getAppsObjQuery } from "./getApps.js";

export async function updateApps(params: {
  args: UpdateAppsEndpointArgs;
  by: string;
  byType: string;
  storage?: IObjStorage;
}) {
  const { args, by, byType, storage } = params;
  const { update, updateMany } = args;

  // Process objFieldsToIndex if it's provided in the update
  let processedObjFieldsToIndex: string[] | null | undefined = undefined;
  if (update.objFieldsToIndex !== undefined) {
    if (Array.isArray(update.objFieldsToIndex)) {
      processedObjFieldsToIndex =
        update.objFieldsToIndex.length > 0
          ? Array.from(new Set(update.objFieldsToIndex))
          : null;
    } else if (update.objFieldsToIndex === null) {
      processedObjFieldsToIndex = null;
    }
  }

  const objQuery = getAppsObjQuery({ args });

  // Create the update object for objRecord
  const updateObj = {
    ...update,
    ...(processedObjFieldsToIndex !== undefined && {
      objFieldsToIndex: processedObjFieldsToIndex,
    }),
  };

  // Only pass fieldsToIndex if we actually want to update it
  const updateManyObjsParams: any = {
    objQuery,
    tag: kObjTags.app,
    by,
    byType,
    update: updateObj,
    count: updateMany ? undefined : 1,
    updateWay: "mergeButReplaceArrays",
    storage,
  };

  await updateManyObjs(updateManyObjsParams);
}
