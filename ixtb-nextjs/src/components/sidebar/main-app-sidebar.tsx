import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { kAppConstants } from "fmdx-core/definitions/appConstants";
import Link from "next/link";
import { AppSidebarGroupContainer } from "./app-sidebar-group-container";
import { HomeSidebarGroup } from "./home-sidebar-group";
import { OrgSidebarGroupContainer } from "./org-sidebar-group-container";

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
        <HomeSidebarGroup />
        {orgId && <OrgSidebarGroupContainer orgId={orgId} />}
        {orgId && appId && (
          <AppSidebarGroupContainer orgId={orgId} appId={appId} />
        )}
      </SidebarContent>
    </Sidebar>
  );

  return sidebar;
}
