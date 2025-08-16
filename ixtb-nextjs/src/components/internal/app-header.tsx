import { cn } from "@/src/lib/utils.ts";
import { SidebarTrigger } from "../ui/sidebar.tsx";
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
        "grid p-4 items-center gap-x-2",
        showSidebarTrigger
          ? "grid-cols-[auto_1fr_auto]"
          : "grid-cols-[1fr_auto]",
        props.className
      )}
    >
      {showSidebarTrigger && (
        <SidebarTrigger variant="outline" className="size-9 cursor-pointer" />
      )}
      <AppHeaderTitle />
      <UserMenu />
    </div>
  );
}
