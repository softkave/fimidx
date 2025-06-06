import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { AppListContainer } from "./apps-container";
import { AppsHeader } from "./apps-header";

export function AppsPage(props: { groupId: string; className?: string }) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <AppsHeader className="p-4" groupId={props.groupId} />
        <AppListContainer groupId={props.groupId} showNoAppsMessage={false} />
      </div>
    </AppPage>
  );
}
