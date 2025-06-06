"use client";

import { useGetGroups } from "@/src/lib/clientApi/group.ts";
import { cn } from "@/src/lib/utils.ts";
import { GetGroupsEndpointArgs, IGroup } from "fmdx-core/definitions/group";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { Groups } from "./group-list.tsx";

export type IGroupListContainerFilter = OmitFrom<
  GetGroupsEndpointArgs,
  "page" | "limit"
>;

export interface IGroupListContainerProps {
  render?: (groups: IGroup[]) => React.ReactNode;
  showNoGroupsMessage?: boolean;
  filter?: IGroupListContainerFilter;
  className?: string;
  groupsContainerClassName?: string;
}

export function GroupListContainer({
  render: inputRender,
  showNoGroupsMessage = true,
  filter,
  className,
  groupsContainerClassName,
}: IGroupListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const groupHooks = useGetGroups({ page, limit: pageSize, ...filter });

  const defaultRender = (groups: IGroup[]) => {
    return <Groups groups={groups} />;
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={groupHooks.isLoading}
        error={groupHooks.error}
        data={groupHooks.data}
        render={(data) =>
          data.groups.length === 0 && showNoGroupsMessage ? (
            <PageMessage
              title="No groups"
              message="No groups found"
              className="px-4 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                groupsContainerClassName
              )}
            >
              {render(data.groups)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={groupHooks.isLoading}
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
