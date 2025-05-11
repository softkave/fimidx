import { IFetchedLog } from "@/src/definitions/log.ts";
import { formatDate } from "@/src/lib/common/date.ts";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "../ui/skeleton.tsx";

export interface ILogItemProps {
  item: IFetchedLog;
}

export function LogItem(props: ILogItemProps) {
  return (
    <div className="flex justify-between items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-4 py-2">
      {formatDate(props.item.timestamp)}
    </div>
  );
}

export function LogItemSkeleton(props: { className?: string }) {
  return (
    <div className={cn("flex justify-between gap-2 px-4", props.className)}>
      <Skeleton className="w-full h-8" />
    </div>
  );
}
