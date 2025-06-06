"use client";

import { AppContainer } from "../app/app-container";
import { AppSidebarGroup } from "./app-sidebar-group";

export function AppSidebarGroupContainer(props: {
  groupId: string;
  appId: string;
}) {
  return (
    <AppContainer
      appId={props.appId}
      render={({ app }) => (
        <AppSidebarGroup groupId={app.groupId} appId={app.id} name={app.name} />
      )}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
