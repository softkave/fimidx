import type {
  INumberMetaQuery,
  IObjPartQueryList,
  IObjQuery,
  IObjSortList,
  IStringMetaQuery,
} from "../../definitions/obj.js";
import { createStorage } from "../../storage/config.js";
import type { IObjStorage } from "../../storage/types.js";

export function metaQueryToPartQueryList(params: {
  metaQuery: Record<string, IStringMetaQuery | INumberMetaQuery>;
  prefix?: string;
}): IObjPartQueryList | undefined {
  const { metaQuery, prefix } = params;
  const partQuery: IObjPartQueryList = [];
  Object.entries(metaQuery).forEach(([key, value]) => {
    Object.keys(value).forEach((op) => {
      const opValue = value[op as keyof typeof value];
      if (!opValue) {
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
    storageType = "mongo",
    storage = createStorage({ type: storageType }),
  } = params;

  // Use the new read method from the storage abstraction
  const result = await storage.read({
    query: objQuery,
    tag,
    page,
    limit,
    sort,
    date,
  });

  return result;
}
