import { cn } from "@/src/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { formatDistanceToNow } from "date-fns";
import { XIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { MemberItemMenu } from "./member-item-menu";
import { kEmailRecordStatus } from "fmdx-core/definitions/email";
import {
  IFetchedMember,
  kMemberStatusLabels,
  kMemberStatus,
} from "fmdx-core/definitions/members";

const memberItemVariants = cva(
  "flex justify-between items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-4 py-2",
  {
    variants: {
      size: {
        default: "gap-2",
        small: "gap-1",
      },
      color: {
        default: "",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
);

const memberItemNameVariants = cva("font-medium", {
  variants: {
    size: {
      default: "text-base",
      small: "text-sm",
    },
    color: {
      default: "",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "default",
    color: "default",
  },
});

const memberItemEmailVariants = cva("text-muted-foreground", {
  variants: {
    size: {
      default: "text-base",
      small: "text-sm",
    },
    color: {
      default: "",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "default",
    color: "default",
  },
});

export interface IMemberItemProps
  extends VariantProps<typeof memberItemVariants> {
  item: IFetchedMember;
  showMenu?: boolean;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}

export function MemberItem(props: IMemberItemProps) {
  const {
    size = "default",
    color = "default",
    item,
    showMenu = true,
    showRemoveButton,
    onRemove,
    disabled,
  } = props;

  return (
    <div className={memberItemVariants({ size, color })}>
      <div className="flex flex-col gap-1 flex-1">
        <div>
          <h3 className={memberItemNameVariants({ size, color })}>
            {item.name ||
              (size === "small" && !item.name ? item.email : "Unknown")}
          </h3>
          {size === "default" && item.name && (
            <p className={memberItemEmailVariants({ size, color })}>
              {item.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-muted-foreground">
            {kMemberStatusLabels[item.status]}
          </Badge>
          {size === "default" &&
            item.emailLastSentAt &&
            item.emailLastSentStatus === kEmailRecordStatus.sent &&
            item.status !== kMemberStatus.accepted && (
              <>
                <span className="text-muted-foreground text-md">·</span>
                <p className="text-muted-foreground text-sm">
                  Email last sent {formatDistanceToNow(item.emailLastSentAt)}{" "}
                  ago
                </p>
              </>
            )}
        </div>
      </div>
      {showMenu && <MemberItemMenu member={item} />}
      {showRemoveButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-muted-foreground"
          disabled={disabled}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export function MemberItemSkeleton(props: { className?: string }) {
  return (
    <div className={cn("flex justify-between gap-2", props.className)}>
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
      <Skeleton className="w-8 h-8" />
    </div>
  );
}
