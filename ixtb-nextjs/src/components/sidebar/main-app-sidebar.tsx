import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import Link from "next/link";
import { AppSidebarOrgContainer } from "./app-sidebar-org-container";
import { HomeSidebarOrg } from "./home-sidebar-org";
import { OrgSidebarOrgContainer } from "./org-sidebar-org-container";

export function MainAppSidebar(props: { orgId?: string; appId?: string }) {
  const { orgId, appId } = props;

  const sidebar = (
    <Sidebar>
      <SidebarHeader>
        <div className="text-2xl font-bold p-2 pt-3">
          <Link href={kClientPaths.app.index}>{kAppConstants.name}</Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <HomeSidebarOrg />
        {orgId && <OrgSidebarOrgContainer orgId={orgId} />}
        {orgId && appId && (
          <AppSidebarOrgContainer orgId={orgId} appId={appId} />
        )}
      </SidebarContent>
    </Sidebar>
  );

  return sidebar;
}
