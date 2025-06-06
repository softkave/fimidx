import type { IObj } from "fmdx-core/definitions/obj";
import type { IClientToken } from "../../definitions/clientToken.js";

export function objToClientToken(obj: IObj): IClientToken {
  return {
    id: obj.id,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    appId: obj.appId,
    name: obj.objRecord.name,
    description: obj.objRecord.description,
    meta: obj.objRecord.meta,
    createdBy: obj.createdBy,
    createdByType: obj.createdByType,
    updatedBy: obj.updatedBy,
    updatedByType: obj.updatedByType,
    groupId: obj.groupId,
    permissions: obj.objRecord.permissions,
  };
}
