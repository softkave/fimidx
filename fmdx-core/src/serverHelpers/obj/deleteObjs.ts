import type {
  IObjArrayField,
  IObjField,
  IObjQuery,
} from "../../definitions/obj.js";
import { createStorage, getDefaultStorageType } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";
import { getObjArrayFields } from "./getObjArrayFields.js";
import { getObjFields } from "./getObjFields.js";

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

  // Fetch both regular fields and array fields for query generation
  let fields: IObjField[] = [];
  let arrayFields: IObjArrayField[] = [];

  if (objQuery.appId) {
    // Fetch regular fields
    const fieldsResult = await getObjFields({
      appId: objQuery.appId,
      tag,
      limit: 1000, // Fetch all fields for this app/tag combination
    });
    fields = fieldsResult.fields;

    // Fetch array fields
    const arrayFieldsResult = await getObjArrayFields({
      appId: objQuery.appId,
      tag,
      limit: 1000, // Fetch all array fields for this app/tag combination
    });
    arrayFields = arrayFieldsResult;
  }

  // Convert to Maps for O(1) lookup
  const fieldsMap = new Map(fields.map((f) => [f.field, f]));
  const arrayFieldsMap = new Map(arrayFields.map((f) => [f.field, f]));

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
    fields: fieldsMap,
    arrayFields: arrayFieldsMap,
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
