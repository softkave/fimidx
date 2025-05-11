import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { MonitorContainer } from "./monitor-container";

export interface IMonitorPageProps {
  orgId: string;
  appId: string;
  monitorId: string;
  className?: string;
}

export function MonitorPage(props: IMonitorPageProps) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <MonitorContainer
          orgId={props.orgId}
          appId={props.appId}
          monitorId={props.monitorId}
        />
      </div>
    </AppPage>
  );
}
