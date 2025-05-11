"use client";

import {
  GetLogsEndpointArgs,
  getLogsSchema,
  IFetchedLog,
  LogPartFilterList,
} from "@/src/definitions/log.ts";
import { useGetLogs } from "@/src/lib/clientApi/log.ts";
import { cn } from "@/src/lib/utils.ts";
import { isNumber } from "lodash-es";
import { ReactNode, useMemo, useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import { z } from "zod";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import UnknownCountListPagination from "../internal/unknown-count-list-pagination.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { Logs } from "./logs-list.tsx";
import { LogsTableSkeleton } from "./logs-table.tsx";

export type ILogListContainerFilter = OmitFrom<
  GetLogsEndpointArgs,
  "page" | "limit"
>;

export interface ILogListContainerProps {
  render?: (logs: IFetchedLog[]) => React.ReactNode;
  showNoLogsMessage?: boolean;
  className?: string;
  logsContainerClassName?: string;
  orgId: string;
  appId: string;
  showFiltersAndSort?: boolean;
}

export function LogListContainer({
  render: inputRender,
  showNoLogsMessage = true,
  className,
  logsContainerClassName,
  orgId,
  appId,
  showFiltersAndSort,
}: ILogListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<LogPartFilterList>([]);

  const args = useMemo(
    (): z.infer<typeof getLogsSchema> => ({
      page,
      limit: pageSize,
      filter: filters.length > 0 ? filters : undefined,
    }),
    [page, pageSize, filters]
  );

  const logHooks = useGetLogs({
    orgId: orgId,
    appId: appId,
    args,
  });

  const defaultRender = (logs: IFetchedLog[]) => {
    return (
      <Logs
        logs={logs}
        orgId={orgId}
        appId={appId}
        filters={filters}
        onFiltersChange={setFilters}
        showFiltersAndSort={showFiltersAndSort}
      />
    );
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={logHooks.isLoading}
        error={logHooks.error}
        data={logHooks.data}
        errorClassName="flex flex-col max-w-lg mx-auto"
        loadingClassName="flex flex-col max-w-lg mx-auto"
        render={(data) => {
          let paginationNode: ReactNode = null;

          if (page > 1 || data.hasMore || data.total) {
            paginationNode = isNumber(data.total) ? (
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={logHooks.isLoading}
                setPage={setPage}
                setPageSize={setPageSize}
                className="py-4 max-w-lg pt-0 mx-auto"
              />
            ) : (
              <UnknownCountListPagination
                hasMore={data.hasMore}
                page={page}
                pageSize={pageSize}
                disabled={logHooks.isLoading}
                setPage={setPage}
                setPageSize={setPageSize}
                className="py-4 max-w-lg pt-0 mx-auto"
              />
            );
          }

          return data.logs.length === 0 && showNoLogsMessage ? (
            <PageMessage
              title="No logs"
              message="No logs found"
              className="px-0 flex flex-col items-center justify-center py-32 flex flex-col max-w-lg pt-0 mx-auto"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                logsContainerClassName
              )}
            >
              {render(data.logs)}
              {paginationNode}
            </div>
          );
        }}
        renderLoading={() => <LogsTableSkeleton />}
      />
    </div>
  );
}
