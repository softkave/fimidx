"use client";

import { useGetMemberById } from "@/src/lib/clientApi/member";
import { IFetchedMember } from "fmdx-core/definitions/members";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { Member } from "./member";

export interface IMemberContainerRenderProps {
  member: IFetchedMember;
}

export interface IMemberContainerProps {
  memberId: string;
  render?: (response: IMemberContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function MemberContainer(props: IMemberContainerProps) {
  const { memberId, renderLoading, renderError } = props;
  const getMemberHook = useGetMemberById({ memberId });

  const error = getMemberHook.error;
  const isLoading = getMemberHook.isLoading;
  const data = useMemo((): IMemberContainerRenderProps | undefined => {
    if (getMemberHook.data) {
      return {
        member: getMemberHook.data.member,
      };
    }
  }, [getMemberHook.data]);

  const defaultRender = useCallback(
    (response: IMemberContainerRenderProps) => (
      <Member member={response.member} />
    ),
    []
  );

  const render = props.render || defaultRender;

  return (
    <WrapLoader
      data={data}
      error={error}
      isLoading={isLoading}
      render={render}
      renderLoading={renderLoading}
      renderError={renderError}
    />
  );
}
