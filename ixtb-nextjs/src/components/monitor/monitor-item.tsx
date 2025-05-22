import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton.tsx";
import { MonitorItemMenu } from "./monitor-item-menu.tsx";
import { IMonitor } from "fmdx-core/definitions/monitor";

export interface IMonitorItemProps {
  item: IMonitor;
}

export function MonitorItem(props: IMonitorItemProps) {
  return (
    <div className="flex justify-between items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-4 py-2">
      <Link
        href={kClientPaths.app.org.app.monitors.single(
          props.item.orgId,
          props.item.appId,
          props.item.id
        )}
        className="flex-1"
      >
        <div>
          <h3 className="font-medium">{props.item.name}</h3>
          <p className="text-muted-foreground">{props.item.description}</p>
        </div>
      </Link>
      <MonitorItemMenu monitor={props.item} appId={props.item.appId} />
    </div>
  );
}

export function MonitorItemSkeleton(props: { className?: string }) {
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
