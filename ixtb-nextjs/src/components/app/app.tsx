import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { IApp } from "fmdx-core/definitions/app";
import Link from "next/link";
import { ValueOf } from "type-fest";
import { ClientTokensPage } from "../client-token/client-tokens-page";
import { LogsPage } from "../log/logs-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AppItemMenu } from "./app-item-menu";

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
  return (
    <div className="flex flex-col gap-4 p-4 pt-0 max-w-lg mx-auto">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">{props.app.name}</h1>
          <p className="text-muted-foreground">{props.app.description}</p>
        </div>
        <AppItemMenu app={props.app} />
      </div>
      <Tabs defaultValue={props.defaultTab} className="w-full">
        <TabsList className="w-full max-w-lg">
          <TabsTrigger value={kAppTabs.clientTokens}>
            <Link
              href={kClientPaths.app.org.app.clientToken.index(
                props.app.orgId,
                props.app.id
              )}
            >
              Client Tokens
            </Link>
          </TabsTrigger>
          <TabsTrigger value={kAppTabs.logs}>
            <Link
              href={kClientPaths.app.org.app.log.index(
                props.app.orgId,
                props.app.id
              )}
            >
              Logs
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={kAppTabs.clientTokens} className="pt-3">
          <ClientTokensPage
            appId={props.app.id}
            orgId={props.app.orgId}
            className="gap-8"
          />
        </TabsContent>
        <TabsContent value={kAppTabs.logs} className="pt-3">
          <LogsPage
            orgId={props.app.orgId}
            appId={props.app.id}
            className="gap-8"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
