import type { IObj } from "fmdx-core/definitions/obj";
import type { IApp } from "../../definitions/app.js";

export function objToApp(obj: IObj): IApp {
  return {
    id: obj.id,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
    updatedBy: obj.updatedBy,
    groupId: obj.groupId,
    name: obj.objRecord.name,
    description: obj.objRecord.description,
    createdByType: obj.createdByType,
    updatedByType: obj.updatedByType,
    objFieldsToIndex: obj.objRecord.objFieldsToIndex,
  };
}
