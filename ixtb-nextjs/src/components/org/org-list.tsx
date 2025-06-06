import { IGroup } from "fmdx-core/definitions/group";
import { PageMessage } from "../internal/page-message";
import { GroupItem, GroupItemSkeleton } from "./group-item";

export interface IGroupsProps {
  groups: IGroup[];
}

export function GroupItemEmpty() {
  return (
    <div className="w-full px-4">
      <PageMessage
        title="No groups found"
        message="Add an group to get started"
        variant="secondary"
      />
    </div>
  );
}

export function Groups(props: IGroupsProps) {
  if (props.groups.length === 0) {
    return <GroupItemEmpty />;
  }

  return (
    <div className="w-full">
      {props.groups.map((group) => (
        <GroupItem key={group.id} item={group} />
      ))}
    </div>
  );
}

export function GroupsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <GroupItemSkeleton className="w-full" />
      <GroupItemSkeleton className="w-full" />
      <GroupItemSkeleton className="w-full" />
    </div>
  );
}
