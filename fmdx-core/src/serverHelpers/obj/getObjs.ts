import { and, eq, inArray } from "drizzle-orm";
import { db, objFields as objFieldsTable } from "../../db/fmdx.sqlite.js";
import type {
  INumberMetaQuery,
  IObjArrayField,
  IObjField,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
  IStringMetaQuery,
} from "../../definitions/obj.js";
import { createStorage, getDefaultStorageType } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";
import { getObjArrayFields } from "./getObjArrayFields.js";
import { getObjFields } from "./getObjFields.js";

export function metaQueryToPartQueryList(params: {
  metaQuery: Record<string, IStringMetaQuery | INumberMetaQuery>;
  prefix?: string;
}): IObjPartQueryList | undefined {
  const { metaQuery, prefix } = params;
  const partQuery: IObjPartQueryList = [];
  Object.entries(metaQuery).forEach(([key, value]) => {
    Object.keys(value).forEach((op) => {
      const opValue = value[op as keyof typeof value];
      if (opValue === undefined || opValue === null) {
        return;
      }

      const field = prefix ? `${prefix}.${key}` : key;

      switch (op) {
        case "eq":
          partQuery.push({
            op: "eq",
            field,
            value: opValue as string | number,
          });
          break;
        case "neq":
          partQuery.push({
            op: "neq",
            field,
            value: opValue as string | number,
          });
          break;
        case "in":
          partQuery.push({
            op: "in",
            field,
            value: opValue as string[] | number[],
          });
          break;
        case "not_in":
          partQuery.push({
            op: "not_in",
            field,
            value: opValue as string[] | number[],
          });
          break;
        case "gt":
          partQuery.push({
            op: "gt",
            field,
            value: opValue as string | number,
          });
          break;
        case "gte":
          partQuery.push({
            op: "gte",
            field,
            value: opValue as string | number,
          });
          break;
        case "lt":
          partQuery.push({
            op: "lt",
            field,
            value: opValue as string | number,
          });
          break;
        case "lte":
          partQuery.push({
            op: "lte",
            field,
            value: opValue as string | number,
          });
          break;
        case "between":
          partQuery.push({
            op: "between",
            field,
            value: opValue as [string | number, string | number],
          });
          break;
        default:
          throw new Error(`Invalid op: ${op}`);
      }
    });
  });

  return partQuery.length ? partQuery : undefined;
}

async function getObjFieldsFromDb(params: {
  appId: string;
  tag: string;
  limit?: number;
  fields?: string[];
}) {
  const { appId, tag, limit = 100, fields } = params;
  return await db
    .select()
    .from(objFieldsTable)
    .where(
      and(
        eq(objFieldsTable.appId, appId),
        eq(objFieldsTable.tag, tag),
        fields ? inArray(objFieldsTable.field, fields) : undefined
      )
    )
    .limit(limit);
}

export async function getManyObjs(params: {
  objQuery: IObjQuery;
  page?: number;
  limit?: number;
  tag: string;
  sort?: IObjSortList;
  date?: Date;
  storage?: IObjStorage;
  storageType?: "mongo" | "postgres";
}) {
  const {
    objQuery,
    page,
    limit,
    tag,
    sort,
    date,
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
    arrayFields = await getObjArrayFields({
      appId: objQuery.appId,
      tag,
      limit: 1000, // Fetch all array fields for this app/tag combination
    });
  }

  // Convert to Maps for O(1) lookup
  const fieldsMap = new Map(fields.map((f) => [f.field, f]));
  const arrayFieldsMap = new Map(arrayFields.map((f) => [f.field, f]));

  // Use the new read method from the storage abstraction
  const result = await storage.read({
    query: objQuery,
    tag,
    page,
    limit,
    sort,
    date,
    fields: fieldsMap,
    arrayFields: arrayFieldsMap,
  });

  return result;
}
