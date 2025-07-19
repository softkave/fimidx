"use client";

import { AppContainer } from "../app/app-container";
import { AppSidebarOrg } from "./app-sidebar-org";

export function AppSidebarOrgContainer(props: {
  orgId: string;
  appId: string;
}) {
  return (
    <AppContainer
      appId={props.appId}
      render={({ app }) => (
        <AppSidebarOrg orgId={app.orgId} appId={app.id} name={app.name} />
      )}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
