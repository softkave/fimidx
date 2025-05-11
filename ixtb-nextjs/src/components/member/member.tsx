import { kEmailRecordStatus } from "@/src/definitions/email";
import {
  IFetchedMember,
  kMemberStatus,
  kMemberStatusLabels,
} from "@/src/definitions/members";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { MemberItemMenu } from "./member-item-menu";

export interface IMemberProps {
  member: IFetchedMember;
}

export function Member(props: IMemberProps) {
  return (
    <div className="flex flex-col gap-4 p-4 pt-0 max-w-lg mx-auto">
      <div className="flex justify-between items-center gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <div>
            <h1 className="text-2xl font-bold">
              {props.member.name || props.member.email || "Unknown"}
            </h1>
            {props.member.name && (
              <p className="text-muted-foreground">{props.member.email}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-muted-foreground">
              {kMemberStatusLabels[props.member.status]}
            </Badge>
          </div>
        </div>
        <MemberItemMenu member={props.member} />
      </div>
      <div className="flex items-center gap-1">
        {props.member.emailLastSentAt &&
          props.member.emailLastSentStatus === kEmailRecordStatus.sent &&
          props.member.status !== kMemberStatus.accepted && (
            <>
              <span className="text-muted-foreground text-md">·</span>
              <p className="text-muted-foreground text-sm">
                Email last sent{" "}
                {formatDistanceToNow(props.member.emailLastSentAt)} ago
              </p>
            </>
          )}
      </div>
    </div>
  );
}
