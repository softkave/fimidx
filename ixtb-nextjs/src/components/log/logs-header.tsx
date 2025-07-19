"use client";

import { cn } from "@/src/lib/utils";
import { LogsHeaderMenu } from "./logs-header-menu";

export function LogsHeader(props: {
  className?: string;
  orgId: string;
  appId: string;
  onShowFiltersAndSort: (showFiltersAndSort: boolean) => void;
  showFiltersAndSort: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center w-full",
        props.className
      )}
    >
      <h1 className="text-2xl font-bold">Logs</h1>
      <LogsHeaderMenu
        onShowFiltersAndSort={props.onShowFiltersAndSort}
        showFiltersAndSort={props.showFiltersAndSort}
      />
    </div>
  );
}
