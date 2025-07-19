import type { IGroup } from "fmdx-core/definitions/group";
import type { IOrg } from "../../../../definitions/org";

export function groupToOrg(group: IGroup): IOrg {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    createdBy: group.createdBy,
    createdByType: group.createdByType,
    updatedBy: group.updatedBy,
    updatedByType: group.updatedByType,
  };
}
