import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { KeyIcon, LogsIcon, MonitorCogIcon } from "lucide-react";
import { useMemo } from "react";
import { ISidebarItem } from "./types";

function getItems(orgId: string, appId: string) {
  const items: ISidebarItem[] = [
    {
      title: "Client Tokens",
      url: kClientPaths.app.org.app.clientToken.index(orgId, appId),
      icon: KeyIcon,
    },
    {
      title: "Logs",
      url: kClientPaths.app.org.app.log.index(orgId, appId),
      icon: LogsIcon,
    },
    {
      title: "Monitors",
      url: kClientPaths.app.org.app.monitors.index(orgId, appId),
      icon: MonitorCogIcon,
    },
  ];

  return items;
}

export function AppSidebarGroup(props: {
  orgId: string;
  appId: string;
  name: string;
}) {
  const items = useMemo(
    () => getItems(props.orgId, props.appId),
    [props.orgId, props.appId]
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
