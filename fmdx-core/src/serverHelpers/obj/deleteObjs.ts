import type { IObjQuery } from "../../definitions/obj.js";
import { createStorage, getDefaultStorageType } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";

export async function deleteManyObjs(params: {
  objQuery: IObjQuery;
  tag: string;
  date?: Date;
  deletedBy: string;
  deletedByType: string;
  deleteMany?: boolean;
  storageType?: "mongo" | "postgres";
  storage?: IObjStorage;
}) {
  const {
    objQuery,
    tag,
    date = new Date(),
    deletedBy,
    deletedByType,
    deleteMany = false,
    storageType = getDefaultStorageType(),
    storage = createStorage({ type: storageType }),
  } = params;

  // Use the new bulkDelete method from the storage abstraction
  const result = await storage.bulkDelete({
    query: objQuery,
    tag,
    date,
    deletedBy,
    deletedByType,
    deleteMany,
    batchSize: 1000,
    hardDelete: false, // Always soft delete for this function
  });

  return result;
}

export async function cleanupDeletedObjs(params?: {
  storageType?: "mongo" | "postgres";
  storage?: IObjStorage;
}) {
  const {
    storageType = getDefaultStorageType(),
    storage = createStorage({ type: storageType }),
  } = params ?? {};

  // Use the new cleanupDeletedObjs method from the storage abstraction
  const result = await storage.cleanupDeletedObjs({
    batchSize: 1000,
    onProgress: (processed) => {
      console.log(`Cleaned up ${processed} deleted objects`);
    },
  });

  return result;
}
