import { IMemberRequest } from "@/src/definitions/members";
import { PageMessage } from "../../internal/page-message";
import {
  MemberRequestItem,
  MemberRequestItemSkeleton,
} from "./member-request-item";

export interface IMemberRequestListProps {
  members: IMemberRequest[];
}

export function MemberRequestListEmpty() {
  return (
    <PageMessage
      title="No member requests found"
      message="You will receive a notification when you are added as a member to an organization."
      variant="secondary"
    />
  );
}

export function MemberRequestList(props: IMemberRequestListProps) {
  if (props.members.length === 0) {
    return <MemberRequestListEmpty />;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {props.members.map((member) => (
        <MemberRequestItem key={member.requestId} item={member} />
      ))}
    </div>
  );
}

export function MemberRequestListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <MemberRequestItemSkeleton />
      <MemberRequestItemSkeleton />
      <MemberRequestItemSkeleton />
    </div>
  );
}
