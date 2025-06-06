import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { GitCompareArrowsIcon, KeyIcon, LogsIcon } from "lucide-react";
import { useMemo } from "react";
import { ISidebarItem } from "./types";

function getItems(groupId: string, appId: string) {
  const items: ISidebarItem[] = [
    {
      title: "Client Tokens",
      url: kClientPaths.app.group.app.clientToken.index(groupId, appId),
      icon: KeyIcon,
    },
    {
      title: "Logs",
      url: kClientPaths.app.group.app.log.index(groupId, appId),
      icon: LogsIcon,
    },
    {
      title: "Callbacks",
      url: kClientPaths.app.group.app.callbacks.index(groupId, appId),
      icon: GitCompareArrowsIcon,
    },
    // {
    //   title: "Monitors",
    //   url: kClientPaths.app.group.app.monitors.index(groupId, appId),
    //   icon: MonitorCogIcon,
    // },
  ];

  return items;
}

export function AppSidebarGroup(props: {
  groupId: string;
  appId: string;
  name: string;
}) {
  const items = useMemo(
    () => getItems(props.groupId, props.appId),
    [props.groupId, props.appId]
  );

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
