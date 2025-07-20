import { IApp } from "fmdx-core/definitions/app";
import { ValueOf } from "type-fest";
import { ClientTokensPage } from "../client-token/client-tokens-page";
import { LogsPage } from "../log/logs-page";
import { AppHeader } from "./app-header";

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
    contentNode = <ClientTokensPage appId={props.app.id} />;
  } else if (defaultTab === kAppTabs.logs) {
    contentNode = <LogsPage appId={props.app.id} />;
  }

  return (
    <div className="max-w-md md:max-w-lg mx-auto w-full">
      <AppHeader app={props.app} />
      {contentNode}
    </div>
  );
}
