import { AppPage } from "../internal/app-page";
import { AppListContainer } from "./apps-container";
import { AppsHeader } from "./apps-header";

export function AppsPage(props: { orgId: string; className?: string }) {
  return (
    <AppPage>
      <div className="flex flex-col max-w-lg mx-auto">
        <AppsHeader orgId={props.orgId} />
        <AppListContainer orgId={props.orgId} showNoAppsMessage={false} />
      </div>
    </AppPage>
  );
}
