import type { GetCallbacksEndpointArgs } from "../../definitions/callback.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
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

  const idempotencyKeyPartQuery = idempotencyKey
    ? metaQueryToPartQueryList({
        metaQuery: { idempotencyKey },
      })
    : undefined;
  const intervalFromPartQuery = intervalFrom
    ? metaQueryToPartQueryList({
        metaQuery: { intervalFrom },
      })
    : undefined;
  const intervalMsPartQuery = intervalMs
    ? metaQueryToPartQueryList({
        metaQuery: { intervalMs },
      })
    : undefined;
  const lastErrorAtPartQuery = lastErrorAt
    ? metaQueryToPartQueryList({
        metaQuery: { lastErrorAt },
      })
    : undefined;
  const lastExecutedAtPartQuery = lastExecutedAt
    ? metaQueryToPartQueryList({
        metaQuery: { lastExecutedAt },
      })
    : undefined;
  const lastSuccessAtPartQuery = lastSuccessAt
    ? metaQueryToPartQueryList({
        metaQuery: { lastSuccessAt },
      })
    : undefined;
  const methodPartQuery = method
    ? metaQueryToPartQueryList({
        metaQuery: { method },
      })
    : undefined;
  const urlPartQuery = url
    ? metaQueryToPartQueryList({
        metaQuery: { url },
      })
    : undefined;
  const timeoutPartQuery = timeout
    ? metaQueryToPartQueryList({
        metaQuery: { timeout },
      })
    : undefined;
  const requestBodyPartQuery = requestBody?.map(
    (part) =>
      ({
        op: part.op,
        field: `requestBody.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );
  const requestHeadersPartQuery = requestHeaders?.map(
    (part) =>
      ({
        op: part.op,
        field: `requestHeaders.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );
  const namePartQuery = name
    ? metaQueryToPartQueryList({
        metaQuery: { name },
      })
    : undefined;

  const filterArr: Array<IObjPartQueryItem> = [
    ...(idempotencyKeyPartQuery ?? []),
    ...(intervalFromPartQuery ?? []),
    ...(intervalMsPartQuery ?? []),
    ...(lastErrorAtPartQuery ?? []),
    ...(lastExecutedAtPartQuery ?? []),
    ...(lastSuccessAtPartQuery ?? []),
    ...(methodPartQuery ?? []),
    ...(urlPartQuery ?? []),
    ...(timeoutPartQuery ?? []),
    ...(requestBodyPartQuery ?? []),
    ...(requestHeadersPartQuery ?? []),
    ...(namePartQuery ?? []),
  ];

  const objQuery: IObjQuery = {
    appId,
    partQuery: {
      and: filterArr,
    },
    metaQuery: { id, createdAt, updatedAt, createdBy, updatedBy },
  };

  return objQuery;
}

export async function getCallbacks(params: { args: GetCallbacksEndpointArgs }) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getCallbacksObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.callback,
    limit: limitNumber,
    page: pageNumber,
    sort: sort ? sort : undefined,
  });

  const callbacks = objs.map(objToCallback);

  return { callbacks, hasMore, page, limit };
}
