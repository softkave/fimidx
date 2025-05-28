import type {
  IObjPartLogicalQuery,
  IObjPartQueryItemNumberValue,
} from "../definitions/obj.js";

import type {
  IObjPartQueryItem,
  IObjPartQueryList,
} from "../definitions/obj.js";
import { getMsFromDuration } from "./date.js";

export function isObjPartQueryItem(query: unknown): query is IObjPartQueryItem {
  return (
    typeof query === "object" &&
    query !== null &&
    "field" in query &&
    "value" in query &&
    "op" in query
  );
}

export function isObjPartQueryList(query: unknown): query is IObjPartQueryList {
  return (
    Array.isArray(query) && query.every((item) => isObjPartQueryItem(item))
  );
}

export function isObjPartLogicalQuery(
  query: unknown
): query is IObjPartLogicalQuery {
  return (
    typeof query === "object" &&
    query !== null &&
    ("and" in query || "or" in query || "not" in query)
  );
}

export function getNumberOrDurationMsFromValue(
  value: IObjPartQueryItemNumberValue
) {
  if (typeof value === "number") {
    return {
      valueNumber: value,
      durationMs: undefined,
    };
  }
  if (typeof value === "string") {
    const date = Date.parse(value);
    return {
      valueNumber: isNaN(date) ? undefined : date,
      durationMs: undefined,
    };
  }
  return {
    valueNumber: undefined,
    durationMs: getMsFromDuration(value),
  };
}
