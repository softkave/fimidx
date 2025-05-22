import { compact, keyBy } from "lodash-es";
import type { IFetchedMember, IMember } from "../../definitions/members.js";
import { getUsers } from "../user.js";

export async function augmentMembers(
  members: IMember[],
  hasReadPermissionsAccess: boolean
): Promise<IFetchedMember[]> {
  const userIds = compact(members.map((member) => member.userId));
  const users = await getUsers(userIds);
  const userMap = keyBy(users, "id");
  const augmentedMembers = members.map((member): IFetchedMember => {
    const user = member.userId ? userMap[member.userId] : null;
    return {
      ...member,
      name: user?.name ?? null,
      permissions: hasReadPermissionsAccess ? member.permissions : null,
    };
  });

  return augmentedMembers;
}
