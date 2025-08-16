import { IApp } from "fimidx-core/definitions/app";
import { ValueOf } from "type-fest";
import { ClientTokensPage } from "../client-token/client-tokens-page";
import { LogsPage } from "../log/logs-page";
import { AppUpdateState } from "./app-update-state";

export const kAppTabs = {
  clientTokens: "clientTokens",
  logs: "logs",
} as const;

export type AppTab = ValueOf<typeof kAppTabs>;

export interface IAppProps {
  app: IApp;
  defaultTab: AppTab;
}

export function App(props: IAppProps) {
  const { defaultTab } = props;
  let contentNode: React.ReactNode = null;

  if (defaultTab === kAppTabs.clientTokens) {
    contentNode = (
      <ClientTokensPage
        appId={props.app.id}
        orgId={props.app.orgId}
        withAppWrapper={false}
      />
    );
  } else if (defaultTab === kAppTabs.logs) {
    contentNode = (
      <LogsPage
        appId={props.app.id}
        orgId={props.app.orgId}
        withAppWrapper={false}
      />
    );
  }

  return (
    <div className="max-w-md md:max-w-lg mx-auto w-full">
      {/* <AppHeader app={props.app} /> */}
      <AppUpdateState app={props.app} />
      {contentNode}
    </div>
  );
}
