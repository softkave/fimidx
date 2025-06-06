import { cn } from "@/src/lib/utils.ts";
import { AppPage } from "../internal/app-page.tsx";
import { MonitorListContainer } from "./monitors-container.tsx";
import { MonitorsHeader } from "./monitors-header.tsx";

export function MonitorsPage(props: {
  groupId: string;
  appId: string;
  className?: string;
}) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <MonitorsHeader
          className="p-4"
          groupId={props.groupId}
          appId={props.appId}
        />
        <MonitorListContainer
          groupId={props.groupId}
          appId={props.appId}
          showNoMonitorsMessage={false}
        />
      </div>
    </AppPage>
  );
}
