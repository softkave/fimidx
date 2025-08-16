"use client";

import { kClientPaths } from "@/src/lib/clientHelpers/clientPaths.ts";
import { cn } from "@/src/lib/utils.ts";
import { kAppConstants } from "fimidx-core/definitions/appConstants";
import Link from "next/link";
import { useContext } from "react";
import { GlobalStateContext } from "../contexts/global-state-context.tsx";
import { useSidebar } from "../ui/sidebar.tsx";

export interface IAppHeaderTitleProps {
  className?: string;
}

export function AppHeaderTitle(props: IAppHeaderTitleProps) {
  const { className } = props;
  const sidebarHook = useSidebar();
  const globalState = useContext(GlobalStateContext);
  const showTitle = !sidebarHook.open;
  const spaceName = globalState.appName ?? globalState.orgName;

  return (
    <div className={cn("flex-1 text-lg font-black", className)}>
      {spaceName ? (
        <Link href={kClientPaths.app.index}>{spaceName}</Link>
      ) : showTitle ? (
        <Link href={kClientPaths.app.index}>{kAppConstants.name}</Link>
      ) : null}
    </div>
  );
}
