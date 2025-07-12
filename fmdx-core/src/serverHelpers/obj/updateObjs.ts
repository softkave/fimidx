import { mergeObjects, type AnyObject } from "softkave-js-utils";
import type {
  IInputObjRecord,
  IObj,
  IObjArrayField,
  IObjField,
  IObjQuery,
  OnConflict,
} from "../../definitions/obj.js";
import { createStorage, getDefaultStorageType } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";
import { getObjArrayFields } from "./getObjArrayFields.js";
import { getObjFields } from "./getObjFields.js";

export function getUpdateObj(params: {
  obj: IObj;
  item: IInputObjRecord;
  date: Date;
  by: string;
  byType: string;
  updateWay: OnConflict;
}) {
  const { obj, date, by, byType, updateWay, item } = params;
  return {
    id: obj.id,
    obj: {
      ...obj,
      updatedAt: date,
      updatedBy: by,
      updatedByType: byType,
      objRecord:
        updateWay === "replace"
          ? item
          : updateWay === "merge"
          ? { ...obj.objRecord, ...item }
          : updateWay === "mergeButReplaceArrays"
          ? mergeObjects(obj.objRecord, item, {
              arrayUpdateStrategy: "replace",
            })
          : updateWay === "mergeButConcatArrays"
          ? mergeObjects(obj.objRecord, item, {
              arrayUpdateStrategy: "concat",
            })
          : updateWay === "mergeButKeepArrays"
          ? mergeObjects(obj.objRecord, item, {
              arrayUpdateStrategy: "retain",
            })
          : obj.objRecord,
    },
  };
}

export async function updateManyObjs(params: {
  objQuery: IObjQuery;
  tag: string;
  update: AnyObject;
  by: string;
  byType: string;
  updateWay?: OnConflict;
  count?: number;
  shouldIndex?: boolean;
  fieldsToIndex?: string[];
  storageType?: "mongo" | "postgres";
  storage?: IObjStorage;
}) {
  const {
    objQuery,
    tag,
    update,
    count,
    by,
    byType,
    updateWay = "mergeButReplaceArrays",
    shouldIndex = true,
    fieldsToIndex,
    storageType = getDefaultStorageType(),
    storage = createStorage({ type: storageType }),
  } = params;

  // Fetch both regular fields and array fields for query generation
  let fields: IObjField[] = [];
  let arrayFields: IObjArrayField[] = [];

  if (objQuery.appId) {
    // Fetch regular fields
    fields = (
      await getObjFields({
        appId: objQuery.appId,
        tag,
        limit: 1000, // Fetch all fields for this app/tag combination
      })
    ).fields;

    // Fetch array fields
    arrayFields = await getObjArrayFields({
      appId: objQuery.appId,
      tag,
      limit: 1000, // Fetch all array fields for this app/tag combination
    });
  }

  // Convert to Maps for O(1) lookup
  const fieldsMap = new Map(fields.map((f) => [f.field, f]));
  const arrayFieldsMap = new Map(arrayFields.map((f) => [f.field, f]));

  const result = await storage.bulkUpdate({
    query: objQuery,
    tag,
    update,
    by,
    byType,
    updateWay,
    count,
    shouldIndex,
    fieldsToIndex,
    batchSize: 1000,
    fields: fieldsMap,
    arrayFields: arrayFieldsMap,
  });

  return result;
}
