"use client";

import { AppContainer } from "../app/app-container";
import { AppSidebarGroup } from "./app-sidebar-group";

export function AppSidebarGroupContainer(props: {
  orgId: string;
  appId: string;
}) {
  return (
    <AppContainer
      orgId={props.orgId}
      appId={props.appId}
      render={({ app }) => (
        <AppSidebarGroup orgId={app.orgId} appId={app.id} name={app.name} />
      )}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
