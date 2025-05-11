import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { BoxesIcon, UserPlus } from "lucide-react";
import { ISidebarItem } from "./types";

const items: ISidebarItem[] = [
  {
    title: "Organizations",
    url: kClientPaths.app.org.index,
    icon: BoxesIcon,
  },
  {
    title: "My Requests",
    url: kClientPaths.app.myRequests,
    icon: UserPlus,
  },
];

export function HomeSidebarGroup() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Home</SidebarGroupLabel>
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
