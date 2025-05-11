import { IFetchedMember, IMember } from "@/src/definitions/members";
import { compact, keyBy } from "lodash-es";
import { getUsers } from "../user";

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
