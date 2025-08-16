import { AppPage } from "../internal/app-page";
import { AppListContainer } from "./apps-container";
import { AppsHeader } from "./apps-header";

export function AppsPage(props: {
  orgId: string;
  className?: string;
  withAppWrapper?: boolean;
}) {
  const { withAppWrapper = true } = props;
  const contentNode = (
    <div className="flex flex-col max-w-lg mx-auto">
      <AppsHeader orgId={props.orgId} />
      <AppListContainer orgId={props.orgId} showNoAppsMessage={false} />
    </div>
  );

  if (withAppWrapper) {
    return <AppPage>{contentNode}</AppPage>;
  }

  return contentNode;
}
