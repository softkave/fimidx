import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarOrg,
  SidebarOrgContent,
  SidebarOrgLabel,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { AppWindow, Users } from "lucide-react";
import { useMemo } from "react";
import { ISidebarItem } from "./types";

function getItems(orgId: string) {
  const items: ISidebarItem[] = [
    {
      title: "Apps",
      url: kClientPaths.app.org.app.index(orgId),
      icon: AppWindow,
    },
    {
      title: "Members",
      url: kClientPaths.app.org.members.index(orgId),
      icon: Users,
    },
  ];

  return items;
}

export function OrgSidebarOrg(props: { orgId: string; name: string }) {
  const items = useMemo(() => getItems(props.orgId), [props.orgId]);

  return (
    <SidebarOrg>
      <SidebarOrgLabel>{props.name}</SidebarOrgLabel>
      <SidebarOrgContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarOrgContent>
    </SidebarOrg>
  );
}
