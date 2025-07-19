"use client";

import { useGetMembers } from "@/src/lib/clientApi/member.ts";
import { cn } from "@/src/lib/utils.ts";
import {
  GetMembersEndpointArgs,
  IFetchedMember,
} from "fmdx-core/definitions/members";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { MemberList } from "./members-list.tsx";

export type IMemberListContainerFilter = OmitFrom<
  GetMembersEndpointArgs,
  "page" | "limit"
>;

export interface IMemberListContainerProps {
  render?: (members: IFetchedMember[]) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  showNoMembersMessage?: boolean;
  filter?: IMemberListContainerFilter;
  membersContainerClassName?: string;
  orgId: string;
}

export function MemberListContainer({
  render: inputRender,
  renderLoading: inputRenderLoading,
  renderError: inputRenderError,
  renderEmpty: inputRenderEmpty,
  showNoMembersMessage = true,
  filter,
  membersContainerClassName,
  orgId,
}: IMemberListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const memberHooks = useGetMembers({
    orgId: orgId,
    page,
    limit: pageSize,
    ...filter,
  });

  const defaultRender = (members: IFetchedMember[]) => {
    return <MemberList members={members} />;
  };

  const defaultRenderEmpty = () => {
    return (
      <PageMessage
        title="No members"
        message="No members found"
        className="px-4 flex flex-col items-center justify-center py-32"
      />
    );
  };

  const render = inputRender ?? defaultRender;
  const renderEmpty = inputRenderEmpty ?? defaultRenderEmpty;

  return (
    <WrapLoader
      isLoading={memberHooks.isLoading}
      error={memberHooks.error}
      data={memberHooks.data}
      renderLoading={inputRenderLoading}
      renderError={inputRenderError}
      render={(data) =>
        data.members.length === 0 && showNoMembersMessage ? (
          renderEmpty()
        ) : (
          <div
            className={cn(
              "flex flex-col items-center w-full",
              membersContainerClassName
            )}
          >
            {render(data.members)}
            <ListPagination
              count={data.total}
              page={page}
              pageSize={pageSize}
              disabled={memberHooks.isLoading}
              setPage={setPage}
              setPageSize={setPageSize}
              className="py-4"
            />
          </div>
        )
      }
    />
  );
}
