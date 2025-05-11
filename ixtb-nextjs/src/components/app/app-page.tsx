import { AppPage as InternalAppPage } from "../internal/app-page";
import { AppTab } from "./app";
import { AppContainer } from "./app-container";

export interface IAppPageProps {
  orgId: string;
  appId: string;
  defaultTab: AppTab;
}

export function AppPage(props: IAppPageProps) {
  return (
    <InternalAppPage>
      <AppContainer
        orgId={props.orgId}
        appId={props.appId}
        defaultTab={props.defaultTab}
      />
    </InternalAppPage>
  );
}
