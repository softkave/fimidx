"use client";

import { OrgContainer } from "../org/org-container";
import { OrgSidebarGroup } from "./org-sidebar-group";

export function OrgSidebarGroupContainer(props: { orgId: string }) {
  return (
    <OrgContainer
      orgId={props.orgId}
      render={({ org }) => <OrgSidebarGroup orgId={org.id} name={org.name} />}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
