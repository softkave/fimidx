"use client";

import { GetOrgsEndpointArgs, IOrg } from "@/src/definitions/org.ts";
import { useGetOrgs } from "@/src/lib/clientApi/org.ts";
import { cn } from "@/src/lib/utils.ts";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { Orgs } from "./org-list.tsx";

export type IOrgListContainerFilter = OmitFrom<
  GetOrgsEndpointArgs,
  "page" | "limit"
>;

export interface IOrgListContainerProps {
  render?: (orgs: IOrg[]) => React.ReactNode;
  showNoOrgsMessage?: boolean;
  filter?: IOrgListContainerFilter;
  className?: string;
  orgsContainerClassName?: string;
}

export function OrgListContainer({
  render: inputRender,
  showNoOrgsMessage = true,
  filter,
  className,
  orgsContainerClassName,
}: IOrgListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const orgHooks = useGetOrgs({ page, limit: pageSize, ...filter });

  const defaultRender = (orgs: IOrg[]) => {
    return <Orgs orgs={orgs} />;
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={orgHooks.isLoading}
        error={orgHooks.error}
        data={orgHooks.data}
        render={(data) =>
          data.orgs.length === 0 && showNoOrgsMessage ? (
            <PageMessage
              title="No organizations"
              message="No organizations found"
              className="px-0 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                orgsContainerClassName
              )}
            >
              {render(data.orgs)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={orgHooks.isLoading}
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
