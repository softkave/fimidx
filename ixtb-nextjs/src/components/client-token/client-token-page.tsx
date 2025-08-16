"use client";

import { cn } from "@/src/lib/utils";
import { AppContainer } from "../app/app-container";
import { AppUpdateState } from "../app/app-update-state";
import { AppPage } from "../internal/app-page";
import { ClientTokenContainer } from "./client-token-container";

export interface IClientTokenPageProps {
  clientTokenId: string;
  appId: string;
  className?: string;
}

export function ClientTokenPage(props: IClientTokenPageProps) {
  return (
    <AppPage>
      <AppContainer
        appId={props.appId}
        render={({ app }) => (
          <div
            className={cn("flex flex-col max-w-lg mx-auto", props.className)}
          >
            <AppUpdateState app={app} />
            <ClientTokenContainer
              appId={props.appId}
              clientTokenId={props.clientTokenId}
            />
          </div>
        )}
      />
    </AppPage>
  );
}
