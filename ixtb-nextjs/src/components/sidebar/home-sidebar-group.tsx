import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarOrg,
  SidebarOrgContent,
  SidebarOrgLabel,
} from "@/src/components/ui/sidebar";
import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths";
import { BoxesIcon, UserPlus } from "lucide-react";
import { ISidebarItem } from "./types";

const items: ISidebarItem[] = [
  {
    title: "Orgs",
    url: kClientPaths.app.org.index,
    icon: BoxesIcon,
  },
  {
    title: "My Requests",
    url: kClientPaths.app.myRequests,
    icon: UserPlus,
  },
];

export function HomeSidebarOrg() {
  return (
    <SidebarOrg>
      <SidebarOrgLabel>Home</SidebarOrgLabel>
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
