"use client";

import { AppContainer } from "../app/app-container";
import { AppSidebarGroup } from "./app-sidebar-group";

export function AppSidebarGroupContainer(props: {
  orgId: string;
  appId: string;
}) {
  return (
    <AppContainer
      appId={props.appId}
      render={({ app }) => (
        <AppSidebarGroup orgId={props.orgId} appId={app.id} name={app.name} />
      )}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
