import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { AppWindow } from "lucide-react";
import { useMemo } from "react";
import { ISidebarItem } from "./types";

function getItems(orgId: string) {
  const items: ISidebarItem[] = [
    {
      title: "Apps",
      url: kClientPaths.app.org.app.index(orgId),
      icon: AppWindow,
    },
  ];

  return items;
}

export function OrgSidebarGroup(props: { orgId: string; name: string }) {
  const items = useMemo(() => getItems(props.orgId), [props.orgId]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{props.name}</SidebarGroupLabel>
      <SidebarGroupContent>
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
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
