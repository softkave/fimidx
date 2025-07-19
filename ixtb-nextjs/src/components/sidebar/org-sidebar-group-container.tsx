"use client";

import { OrgContainer } from "../org/org-container";
import { OrgSidebarOrg } from "./org-sidebar-org";

export function OrgSidebarOrgContainer(props: { orgId: string }) {
  return (
    <OrgContainer
      orgId={props.orgId}
      render={({ org }) => <OrgSidebarOrg orgId={org.id} name={org.name} />}
      renderLoading={() => null}
      renderError={() => null}
    />
  );
}
