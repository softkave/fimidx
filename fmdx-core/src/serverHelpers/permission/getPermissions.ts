import { isObjPartQueryList } from "../../common/obj.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import type { GetPermissionsEndpointArgs } from "../../definitions/permission.js";
import { getManyObjs, metaQueryToPartQueryList } from "../obj/getObjs.js";
import { objToPermission } from "./objToPermission.js";

export function getPermissionsObjQuery(params: {
  args: GetPermissionsEndpointArgs;
}) {
  const { args } = params;
  const {
    query: {
      appId,
      id,
      entity,
      action,
      target,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    },
  } = args;

  const entityPartQuery = isObjPartQueryList(entity)
    ? entity?.map(
        (part) =>
          ({
            op: part.op,
            field: `entity.${part.field}`,
            value: part.value,
          } as IObjPartQueryItem)
      )
    : entity
    ? metaQueryToPartQueryList({
        metaQuery: { entity },
      })
    : undefined;
  const actionPartQuery = isObjPartQueryList(action)
    ? action?.map(
        (part) =>
          ({
            op: part.op,
            field: `action.${part.field}`,
            value: part.value,
          } as IObjPartQueryItem)
      )
    : action
    ? metaQueryToPartQueryList({
        metaQuery: { action },
      })
    : undefined;
  const targetPartQuery = isObjPartQueryList(target)
    ? target?.map(
        (part) =>
          ({
            op: part.op,
            field: `target.${part.field}`,
            value: part.value,
          } as IObjPartQueryItem)
      )
    : target
    ? metaQueryToPartQueryList({
        metaQuery: { target },
      })
    : undefined;

  const filterArr: Array<IObjPartQueryItem> = [
    ...(entityPartQuery ?? []),
    ...(actionPartQuery ?? []),
    ...(targetPartQuery ?? []),
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

export async function getPermissions(params: {
  args: GetPermissionsEndpointArgs;
}) {
  const { args } = params;
  const { page: inputPage, limit: inputLimit, sort } = args;

  const pageNumber = inputPage ?? 1;
  const limitNumber = inputLimit ?? 100;

  const objQuery = getPermissionsObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.permission,
    limit: limitNumber,
    page: pageNumber,
    sort: sort ? sort : undefined,
  });

  const permissions = objs.map(objToPermission);

  return { permissions, hasMore, page, limit };
}
