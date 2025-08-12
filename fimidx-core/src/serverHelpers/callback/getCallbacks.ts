import type { GetCallbacksEndpointArgs } from "../../definitions/callback.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import type { IObjStorage } from "../../storage/types.js";
import { getManyObjs } from "../obj/getObjs.js";
import { objToCallback } from "./objToCallback.js";

export function getCallbacksObjQuery(params: {
  args: GetCallbacksEndpointArgs;
}) {
  const { args } = params;
  const { query } = args;
  const {
    appId,
    createdBy,
    updatedBy,
    idempotencyKey,
    intervalFrom,
    intervalMs,
    lastErrorAt,
    lastExecutedAt,
    lastSuccessAt,
    method,
    requestBody,
    requestHeaders,
    timeout,
    url,
    createdAt,
    id,
    updatedAt,
    name,
  } = query;

  const filterArr: Array<IObjPartQueryItem> = [];

  // Handle name filtering - name is stored in objRecord.name
  if (name) {
    // Convert name query to partQuery for the name field
    Object.entries(name).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "name",
          value,
        });
      }
    });
  }

  // Handle idempotencyKey filtering
  if (idempotencyKey) {
    Object.entries(idempotencyKey).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "idempotencyKey",
          value,
        });
      }
    });
  }

  // Handle url filtering
  if (url) {
    Object.entries(url).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "url",
          value,
        });
      }
    });
  }

  // Handle method filtering
  if (method) {
    Object.entries(method).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "method",
          value,
        });
      }
    });
  }

  // Handle timeout filtering
  if (timeout) {
    Object.entries(timeout).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "timeout",
          value,
        });
      }
    });
  }

  // Handle intervalFrom filtering
  if (intervalFrom) {
    Object.entries(intervalFrom).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "intervalFrom",
          value,
        });
      }
    });
  }

  // Handle intervalMs filtering
  if (intervalMs) {
    Object.entries(intervalMs).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "intervalMs",
          value,
        });
      }
    });
  }

  // Handle lastExecutedAt filtering
  if (lastExecutedAt) {
    Object.entries(lastExecutedAt).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "lastExecutedAt",
          value,
        });
      }
    });
  }

  // Handle lastSuccessAt filtering
  if (lastSuccessAt) {
    Object.entries(lastSuccessAt).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "lastSuccessAt",
          value,
        });
      }
    });
  }

  // Handle lastErrorAt filtering
  if (lastErrorAt) {
    Object.entries(lastErrorAt).forEach(([op, value]) => {
      if (value !== undefined) {
        filterArr.push({
          op: op as any,
          field: "lastErrorAt",
          value,
        });
      }
    });
  }

  // Handle requestBody field filtering
  const requestBodyPartQuery = requestBody?.map(
    (part) =>
      ({
        op: part.op,
        field: `requestBody.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );
  if (requestBodyPartQuery) {
    filterArr.push(...requestBodyPartQuery);
  }

  // Handle requestHeaders field filtering
  const requestHeadersPartQuery = requestHeaders?.map(
    (part) =>
      ({
        op: part.op,
        field: `requestHeaders.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );
  if (requestHeadersPartQuery) {
    filterArr.push(...requestHeadersPartQuery);
  }

  const objQuery: IObjQuery = {
    appId,
    partQuery: filterArr.length > 0 ? { and: filterArr } : undefined,
    metaQuery: { id, createdAt, updatedAt, createdBy, updatedBy },
  };

  return objQuery;
}

export async function getCallbacks(params: {
  args: GetCallbacksEndpointArgs;
  storage?: IObjStorage;
}) {
  const { args, storage } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  // Convert 1-based pagination to 0-based for storage layer
  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;
  const storagePage = pageNumber - 1; // Convert to 0-based

  // Transform sort fields to use objRecord prefix for name field
  const transformedSort = sort?.map((sortItem) => {
    if (sortItem.field === "name") {
      return { ...sortItem, field: "objRecord.name" };
    }
    return sortItem;
  });

  const objQuery = getCallbacksObjQuery({ args });
  const result = await getManyObjs({
    objQuery,
    page: storagePage,
    limit: limitNumber,
    tag: kObjTags.callback,
    sort: transformedSort,
    storage,
  });

  return {
    callbacks: result.objs.map(objToCallback),
    page: pageNumber, // Return 1-based page number
    limit: limitNumber,
    hasMore: result.hasMore,
  };
}
