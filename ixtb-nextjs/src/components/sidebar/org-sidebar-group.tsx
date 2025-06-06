import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { AppWindow, Users } from "lucide-react";
import { useMemo } from "react";
import { ISidebarItem } from "./types";

function getItems(groupId: string) {
  const items: ISidebarItem[] = [
    {
      title: "Apps",
      url: kClientPaths.app.group.app.index(groupId),
      icon: AppWindow,
    },
    {
      title: "Members",
      url: kClientPaths.app.group.members.index(groupId),
      icon: Users,
    },
  ];

  return items;
}

export function GroupSidebarGroup(props: { groupId: string; name: string }) {
  const items = useMemo(() => getItems(props.groupId), [props.groupId]);

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
