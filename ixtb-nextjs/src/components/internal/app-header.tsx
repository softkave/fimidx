import { cn } from "@/src/lib/utils.ts";
import { SidebarTrigger } from "../ui/sidebar";
import { AppHeaderTitle } from "./app-header-title.tsx";
import { UserMenu } from "./user-menu.tsx";

export interface IAppHeaderProps {
  className?: string;
  showSidebarTrigger?: boolean;
}

export function AppHeader(props: IAppHeaderProps) {
  const { showSidebarTrigger } = props;

  return (
    <div
      className={cn(
        "flex justify-between p-4 items-center space-x-2",
        props.className
      )}
    >
      {showSidebarTrigger && (
        <SidebarTrigger variant="secondary" className="size-9 cursor-pointer" />
      )}
      <AppHeaderTitle />
      <UserMenu />
    </div>
  );
}
