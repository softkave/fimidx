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
  withAppWrapper?: boolean;
}) {
  const { withAppWrapper = true } = props;
  const [showFiltersAndSort, setShowFiltersAndSort] = useState(false);

  const contentNode = (
    <div className={cn("flex flex-col", props.className)}>
      <LogsHeader
        className="max-w-lg mx-auto"
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
  );

  if (withAppWrapper) {
    return <AppPage>{contentNode}</AppPage>;
  }

  return contentNode;
}
