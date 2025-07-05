import assert from "assert";
import type {
  GetClientTokensEndpointArgs,
  IClientTokenObjRecordMeta,
} from "../../definitions/clientToken.js";
import {
  kObjTags,
  type IObjPartQueryItem,
  type IObjQuery,
} from "../../definitions/obj.js";
import type { IPermissionAtom } from "../../definitions/permission.js";
import type { IObjStorage } from "../../storage/types.js";
import { getManyObjs } from "../obj/getObjs.js";
import { getPermissions } from "../permission/getPermissions.js";
import { getOriginalClientTokenPermission } from "./addClientTokenPermissions.js";
import { objToClientToken } from "./objToClientToken.js";

export function getClientTokensObjQuery(params: {
  args: GetClientTokensEndpointArgs;
}) {
  const { args } = params;
  const { query } = args;
  const { name, meta, appId, id, createdAt, updatedAt, createdBy, updatedBy } =
    query;

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

  // Handle meta field filtering
  const metaPartQuery = meta?.map(
    (part) =>
      ({
        op: part.op,
        field: `meta.${part.field}`,
        value: part.value,
      } as IObjPartQueryItem)
  );

  if (metaPartQuery) {
    filterArr.push(...metaPartQuery);
  }

  const objQuery: IObjQuery = {
    appId,
    partQuery: filterArr.length > 0 ? { and: filterArr } : undefined,
    metaQuery: { id, createdAt, updatedAt, createdBy, updatedBy },
  };

  return objQuery;
}

export async function getClientTokensPermissions(params: {
  appId: string;
  clientTokenIds: string[];
  groupId: string;
  storage?: IObjStorage;
}) {
  const { appId, clientTokenIds, groupId, storage } = params;
  const { permissions } = await getPermissions({
    args: {
      query: {
        appId,
        meta: [
          {
            op: "in",
            field: "__fmdx_managed_clientTokenId",
            value: clientTokenIds,
          },
          {
            op: "eq",
            field: "__fmdx_managed_groupId",
            value: groupId,
          },
        ],
      },
    },
    storage,
  });

  return {
    permissions,
  };
}

export async function getClientTokens(params: {
  args: GetClientTokensEndpointArgs;
  includePermissions?: boolean;
  storage?: IObjStorage;
}) {
  const { args, includePermissions = false, storage } = params;
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

  const objQuery = getClientTokensObjQuery({ args });
  const { objs, hasMore, page, limit } = await getManyObjs({
    objQuery,
    tag: kObjTags.clientToken,
    limit: limitNumber,
    page: storagePage,
    sort: transformedSort,
    storage,
  });

  const { permissions } = includePermissions
    ? await getClientTokensPermissions({
        appId: args.query.appId,
        clientTokenIds: objs.map((obj) => obj.id),
        groupId: objs[0]?.groupId || "",
        storage,
      })
    : {
        permissions: [],
      };

  const permissionsMap = permissions.reduce((acc, permission) => {
    assert(permission.meta, "Permission meta is required");
    const meta = permission.meta as IClientTokenObjRecordMeta;
    const clientTokenId = meta.__fmdx_managed_clientTokenId;
    if (!acc[clientTokenId]) {
      acc[clientTokenId] = [];
    }
    // Transform the permission back to original format
    const originalPermission = getOriginalClientTokenPermission({
      permission,
      clientTokenId,
    });
    acc[clientTokenId].push(originalPermission);
    return acc;
  }, {} as Record<string, IPermissionAtom[]>);

  const clientTokens = objs.map((obj) => {
    const clientTokenPermissions = permissionsMap[obj.id] || null;
    const clientToken = objToClientToken(obj, clientTokenPermissions);
    return clientToken;
  });

  return {
    clientTokens,
    hasMore,
    page: pageNumber, // Return 1-based page number
    limit: limitNumber,
  };
}
