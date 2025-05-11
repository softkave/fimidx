import { IFetchedMember } from "@/src/definitions/members";
import { PageMessage } from "../internal/page-message";
import { MemberItem, MemberItemSkeleton } from "./member-item";

export interface IMemberListProps {
  members: IFetchedMember[];
  onRemove?: (member: IFetchedMember) => void;
  showRemoveButton?: boolean;
  showMenu?: boolean;
  size?: "default" | "small";
  color?: "default" | "muted";
  disabled?: boolean;
}

export function MemberListEmpty() {
  return (
    <PageMessage
      title="No members found"
      message="Add a member to get started"
      variant="secondary"
    />
  );
}

export function MemberList(props: IMemberListProps) {
  if (props.members.length === 0) {
    return <MemberListEmpty />;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {props.members.map((member) => (
        <MemberItem
          key={member.id}
          item={member}
          showMenu={props.showMenu}
          showRemoveButton={props.showRemoveButton}
          onRemove={() => props.onRemove?.(member)}
          size={props.size}
          color={props.color}
          disabled={props.disabled}
        />
      ))}
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <MemberItemSkeleton />
      <MemberItemSkeleton />
      <MemberItemSkeleton />
    </div>
  );
}
