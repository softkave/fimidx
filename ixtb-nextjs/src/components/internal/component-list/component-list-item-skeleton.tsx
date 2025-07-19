import { cn } from "@/src/lib/utils";
import { Skeleton } from "../../ui/skeleton";

export function ComponentListItemSkeleton(props: { className?: string }) {
  return (
    <div
      className={cn(
        "flex justify-between gap-2 rounded-md py-4 px-4 transition-colors animate-pulse",
        props.className
      )}
    >
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
      <Skeleton className="w-8 h-8" />
    </div>
  );
}
