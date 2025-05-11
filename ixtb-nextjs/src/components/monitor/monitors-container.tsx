"use client";

import {
  GetMonitorsEndpointArgs,
  IMonitor,
} from "@/src/definitions/monitor.ts";
import { useGetMonitors } from "@/src/lib/clientApi/monitor.ts";
import { cn } from "@/src/lib/utils.ts";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { Monitors } from "./monitors-list.tsx";

export type IMonitorListContainerFilter = OmitFrom<
  GetMonitorsEndpointArgs,
  "page" | "limit"
>;

export interface IMonitorListContainerProps {
  render?: (monitors: IMonitor[]) => React.ReactNode;
  showNoMonitorsMessage?: boolean;
  filter?: IMonitorListContainerFilter;
  className?: string;
  monitorsContainerClassName?: string;
  orgId: string;
  appId: string;
}

export function MonitorListContainer({
  render: inputRender,
  showNoMonitorsMessage = true,
  filter,
  className,
  monitorsContainerClassName,
  orgId,
  appId,
}: IMonitorListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const monitorHooks = useGetMonitors({
    orgId: orgId,
    appId: appId,
    page,
    limit: pageSize,
    ...filter,
  });

  const defaultRender = (monitors: IMonitor[]) => {
    return <Monitors monitors={monitors} />;
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={monitorHooks.isLoading}
        error={monitorHooks.error}
        data={monitorHooks.data}
        render={(data) =>
          data.monitors.length === 0 && showNoMonitorsMessage ? (
            <PageMessage
              title="No monitors"
              message="No monitors found"
              className="px-0 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                monitorsContainerClassName
              )}
            >
              {render(data.monitors)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={monitorHooks.isLoading}
                setPage={setPage}
                setPageSize={setPageSize}
                className="py-4"
              />
            </div>
          )
        }
      />
    </div>
  );
}
