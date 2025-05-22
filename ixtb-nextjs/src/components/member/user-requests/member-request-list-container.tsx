"use client";

import { useGetUserRequests } from "@/src/lib/clientApi/member";
import { cn } from "@/src/lib/utils";
import { IMemberRequest } from "fmdx-core/definitions/members";
import { useState } from "react";
import ListPagination from "../../internal/list-pagination";
import { WrapLoader } from "../../internal/wrap-loader";
import {
  MemberRequestList,
  MemberRequestListEmpty,
} from "./member-request-list";

export function MemberRequestListContainer(props: {
  className?: string;
  membersContainerClassName?: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getUserRequestsHook = useGetUserRequests({
    page,
    limit: pageSize,
  });

  const render = (requests: IMemberRequest[]) => {
    return <MemberRequestList members={requests} />;
  };

  return (
    <div className={cn("flex flex-col items-center w-full", props.className)}>
      <WrapLoader
        isLoading={getUserRequestsHook.isLoading}
        error={getUserRequestsHook.error}
        data={getUserRequestsHook.data}
        render={(data) =>
          data.requests.length === 0 ? (
            <MemberRequestListEmpty />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full px-4",
                props.membersContainerClassName
              )}
            >
              {render(data.requests)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={getUserRequestsHook.isLoading}
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
