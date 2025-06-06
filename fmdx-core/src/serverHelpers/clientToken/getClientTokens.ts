import type { GetClientTokensEndpointArgs } from "../../definitions/clientToken.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToClientToken } from "./objToClientToken.js";

export function getClientTokensObjQuery(params: {
  args: GetClientTokensEndpointArgs;
}) {
  const { args } = params;
  const { query } = args;
  const { name, meta, appId, id, createdAt, updatedAt, createdBy, updatedBy } =
    query;

  const namePartQuery = name
    ? metaQueryToPartQueryList({
        metaQuery: { name },
      })
    : undefined;

  const metaPartQuery = meta?.map(
    (part) =>
      ({
        op: part.op,
        field: `meta.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );

  const filterArr: Array<IObjPartQueryItem> = [
    ...(namePartQuery ?? []),
    ...(metaPartQuery ?? []),
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

export async function getClientTokens(params: {
  args: GetClientTokensEndpointArgs;
}) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getClientTokensObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.clientToken,
    limit: limitNumber,
    page: pageNumber,
    sort: sort ? sort : undefined,
  });

  const clientTokens = objs.map(objToClientToken);
  return { clientTokens, hasMore, page, limit };
}
