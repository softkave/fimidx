"use client";

import { GetAppsEndpointArgs, IApp } from "@/src/definitions/app.ts";
import { useGetApps } from "@/src/lib/clientApi/app.ts";
import { cn } from "@/src/lib/utils.ts";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { Apps } from "./apps-list.tsx";
export type IAppListContainerFilter = OmitFrom<
  GetAppsEndpointArgs,
  "page" | "limit"
>;

export interface IAppListContainerProps {
  render?: (apps: IApp[]) => React.ReactNode;
  showNoAppsMessage?: boolean;
  filter?: IAppListContainerFilter;
  className?: string;
  appsContainerClassName?: string;
  orgId: string;
}

export function AppListContainer({
  render: inputRender,
  showNoAppsMessage = true,
  filter,
  className,
  appsContainerClassName,
  orgId,
}: IAppListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const appHooks = useGetApps({
    orgId: orgId,
    page,
    limit: pageSize,
    ...filter,
  });

  const defaultRender = (apps: IApp[]) => {
    return <Apps apps={apps} />;
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={appHooks.isLoading}
        error={appHooks.error}
        data={appHooks.data}
        render={(data) =>
          data.apps.length === 0 && showNoAppsMessage ? (
            <PageMessage
              title="No apps"
              message="No apps found"
              className="px-0 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                appsContainerClassName
              )}
            >
              {render(data.apps)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={appHooks.isLoading}
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
