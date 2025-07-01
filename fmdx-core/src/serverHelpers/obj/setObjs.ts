import type {
  ISetManyObjsEndpointArgs,
  ISetManyObjsEndpointResponse,
} from "../../definitions/obj.js";
import { createDefaultStorage } from "../../storage/config.js";

export async function setManyObjs(params: {
  tag: string;
  input: ISetManyObjsEndpointArgs;
  by: string;
  byType: string;
  groupId: string;
}): Promise<ISetManyObjsEndpointResponse> {
  const { tag, input, by, byType, groupId } = params;

  const storage = createDefaultStorage();

  // Use the new bulkUpsert method from the storage abstraction
  const result = await storage.bulkUpsert!({
    items: input.items,
    conflictOnKeys: input.conflictOnKeys || [],
    onConflict: input.onConflict || "replace",
    tag,
    appId: input.appId,
    groupId,
    createdBy: by,
    createdByType: byType,
    shouldIndex: input.shouldIndex ?? true,
    fieldsToIndex: input.fieldsToIndex
      ? Array.from(new Set(input.fieldsToIndex))
      : undefined,
    batchSize: 20, // Conflict detection batch size
  });

  return {
    newObjs: result.newObjs,
    updatedObjs: result.updatedObjs,
    ignoredItems: result.ignoredItems,
    failedItems: result.failedItems,
  };
}
