"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths.ts";
import { cn } from "@/src/lib/utils.ts";
import { kAppConstants } from "fimidx-core/definitions/appConstants";
import Link from "next/link";
import { useSidebar } from "../ui/sidebar.tsx";

export interface IAppHeaderTitleProps {
  className?: string;
  showSidebarTrigger?: boolean;
}

export function AppHeaderTitle(props: IAppHeaderTitleProps) {
  const { showSidebarTrigger } = props;
  const sidebarHook = useSidebar();
  const showTitle = !sidebarHook.open || !showSidebarTrigger;

  return (
    <div className={cn("text-2xl font-bold flex-1", props.className)}>
      {showTitle && (
        <Link href={kClientPaths.app.index}>{kAppConstants.name}</Link>
      )}
    </div>
  );
}
