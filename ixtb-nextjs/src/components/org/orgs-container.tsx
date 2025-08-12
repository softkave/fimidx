"use client";

import { GetOrgsEndpointArgs, IOrg } from "@/src/definitions/org.ts";
import { useGetOrgs } from "@/src/lib/clientApi/org.ts";
import { cn } from "@/src/lib/utils.ts";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import { ComponentListMessage } from "../internal/component-list/component-list-message.tsx";
import UnknownCountListPagination from "../internal/unknown-count-list-pagination.tsx";
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
            <ComponentListMessage
              title="No organizations found"
              message="Add an organization to get started"
              className="w-full"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                orgsContainerClassName
              )}
            >
              {render(data.orgs)}
              <UnknownCountListPagination
                hasMore={data.hasMore}
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
