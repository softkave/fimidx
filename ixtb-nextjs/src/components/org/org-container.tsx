"use client";

import { useGetGroup } from "@/src/lib/clientApi/group";
import { IGroup } from "fmdx-core/definitions/group";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { Group, GroupTab, kGroupTabs } from "./group";

export interface IGroupContainerRenderProps {
  group: IGroup;
}

export interface IGroupContainerProps {
  groupId: string;
  defaultTab?: GroupTab;
  render?: (response: IGroupContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function GroupContainer(props: IGroupContainerProps) {
  const {
    groupId,
    defaultTab = kGroupTabs.apps,
    renderLoading,
    renderError,
  } = props;
  const getGroupHook = useGetGroup({ groupId });

  const error = getGroupHook.error;
  const isLoading = getGroupHook.isLoading;
  const data = useMemo((): IGroupContainerRenderProps | undefined => {
    if (getGroupHook.data) {
      return {
        group: getGroupHook.data.group,
      };
    }
  }, [getGroupHook.data]);

  const defaultRender = useCallback(
    (response: IGroupContainerRenderProps) => (
      <Group group={response.group} defaultTab={defaultTab} />
    ),
    [defaultTab]
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
