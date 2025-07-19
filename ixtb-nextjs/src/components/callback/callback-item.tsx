import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import { ICallback } from "fmdx-core/definitions/callback";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton.tsx";

export interface ICallbackItemProps {
  item: ICallback;
}

export function CallbackItem(props: ICallbackItemProps) {
  return (
    <div className="flex justify-between items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-4 py-2">
      <Link
        href={kClientPaths.app.org.app.callbacks.single(
          props.item.orgId,
          props.item.appId,
          props.item.id
        )}
        className="flex-1"
      >
        <div>
          <h3 className="font-medium">{props.item.id}</h3>
        </div>
      </Link>
    </div>
  );
}

export function CallbackItemSkeleton(props: { className?: string }) {
  return (
    <div className={cn("flex justify-between gap-2 px-4", props.className)}>
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-full h-8" />
      </div>
      <Skeleton className="w-8 h-8" />
    </div>
  );
}
