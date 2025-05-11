import {
  IMemberRequest,
  kMemberStatus,
  kMemberStatusLabels,
} from "@/src/definitions/members";
import { useRespondToMemberRequest } from "@/src/lib/clientApi/member";
import { cn } from "@/src/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";

export interface IMemberRequestItemProps {
  item: IMemberRequest;
  onResponded?: () => void;
  onResponding?: () => void;
}

export function MemberRequestItem(props: IMemberRequestItemProps) {
  const selectedStatusRef = useRef<
    typeof kMemberStatus.accepted | typeof kMemberStatus.rejected | null
  >(null);

  const respondToMemberRequestHook = useRespondToMemberRequest({
    orgId: props.item.orgId,
    memberId: props.item.requestId,
    onSuccess: () => {
      toast.success("Member request responded to");
      props.onResponded?.();
    },
  });

  const handleRespond = (
    status: typeof kMemberStatus.accepted | typeof kMemberStatus.rejected
  ) => {
    selectedStatusRef.current = status;
    props.onResponding?.();
    respondToMemberRequestHook.trigger({
      status,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="font-medium">{props.item.orgName}</h3>
        <p className="text-muted-foreground">
          Sent {formatDistanceToNow(props.item.createdAt)} ago
        </p>
        <Badge variant="outline">
          {kMemberStatusLabels[props.item.status]}
        </Badge>
      </div>
      {props.item.status === kMemberStatus.pending && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="destructive"
            className={cn(
              "w-full",
              respondToMemberRequestHook.isMutating && "animate-pulse"
            )}
            onClick={() => handleRespond(kMemberStatus.rejected)}
            disabled={respondToMemberRequestHook.isMutating}
          >
            {selectedStatusRef.current === kMemberStatus.rejected && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Reject
          </Button>
          <Button
            className={cn(
              "w-full",
              respondToMemberRequestHook.isMutating && "animate-pulse"
            )}
            onClick={() => handleRespond(kMemberStatus.accepted)}
            disabled={respondToMemberRequestHook.isMutating}
          >
            {selectedStatusRef.current === kMemberStatus.accepted && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}

export function MemberRequestItemSkeleton(props: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", props.className)}>
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
    </div>
  );
}
