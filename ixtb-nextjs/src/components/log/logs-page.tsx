"use client";

import { cn } from "@/src/lib/utils.ts";
import { useState } from "react";
import { AppPage } from "../internal/app-page.tsx";
import { LogListContainer } from "./logs-container.tsx";
import { LogsHeader } from "./logs-header.tsx";

export function LogsPage(props: {
  orgId: string;
  appId: string;
  className?: string;
}) {
  const [showFiltersAndSort, setShowFiltersAndSort] = useState(false);

  return (
    <AppPage>
      <div className={cn("flex flex-col", props.className)}>
        <LogsHeader
          className="p-4 pt-0 max-w-lg mx-auto"
          orgId={props.orgId}
          appId={props.appId}
          onShowFiltersAndSort={setShowFiltersAndSort}
          showFiltersAndSort={showFiltersAndSort}
        />
        <LogListContainer
          orgId={props.orgId}
          appId={props.appId}
          showNoLogsMessage={false}
          showFiltersAndSort={showFiltersAndSort}
        />
      </div>
    </AppPage>
  );
}
