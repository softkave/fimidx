import { IMonitor } from "@/src/definitions/monitor";
import { PageMessage } from "../internal/page-message.tsx";
import { MonitorItem, MonitorItemSkeleton } from "./monitor-item.tsx";

export interface IMonitorsProps {
  monitors: IMonitor[];
}

export function MonitorItemEmpty() {
  return (
    <div className="w-full">
      <PageMessage
        title="No monitors found"
        message="Add a monitor to get started"
        variant="secondary"
      />
    </div>
  );
}

export function Monitors(props: IMonitorsProps) {
  if (props.monitors.length === 0) {
    return <MonitorItemEmpty />;
  }

  return (
    <div className="w-full">
      {props.monitors.map((monitor) => (
        <MonitorItem key={monitor.id} item={monitor} />
      ))}
    </div>
  );
}

export function MonitorsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <MonitorItemSkeleton className="w-full" />
      <MonitorItemSkeleton className="w-full" />
      <MonitorItemSkeleton className="w-full" />
    </div>
  );
}
