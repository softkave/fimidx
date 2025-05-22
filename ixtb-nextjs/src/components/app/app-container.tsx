"use client";

import { useGetApp } from "@/src/lib/clientApi/app";
import { IApp } from "fmdx-core/definitions/app";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { App, AppTab, kAppTabs } from "./app";

export interface IAppContainerRenderProps {
  app: IApp;
}

export interface IAppContainerProps {
  appId: string;
  defaultTab?: AppTab;
  render?: (response: IAppContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function AppContainer(props: IAppContainerProps) {
  const {
    appId,
    defaultTab = kAppTabs.logs,
    renderLoading,
    renderError,
  } = props;
  const getAppHook = useGetApp({ appId });

  const error = getAppHook.error;
  const isLoading = getAppHook.isLoading;
  const data = useMemo((): IAppContainerRenderProps | undefined => {
    if (getAppHook.data) {
      return {
        app: getAppHook.data.app,
      };
    }
  }, [getAppHook.data]);

  const defaultRender = useCallback(
    (response: IAppContainerRenderProps) => (
      <App app={response.app} defaultTab={defaultTab} />
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
