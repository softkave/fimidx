import { cn } from "@/src/lib/utils";
import { AppPage } from "../internal/app-page";
import { AppListContainer } from "./apps-container";
import { AppsHeader } from "./apps-header";

export function AppsPage(props: { orgId: string; className?: string }) {
  return (
    <AppPage>
      <div
        className={cn("flex flex-col max-w-lg pt-0 mx-auto", props.className)}
      >
        <AppsHeader className="p-4" orgId={props.orgId} />
        <AppListContainer orgId={props.orgId} showNoAppsMessage={false} />
      </div>
    </AppPage>
  );
}
