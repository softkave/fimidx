"use client";

import { IMonitor } from "@/src/definitions/monitor";
import { useGetMonitor } from "@/src/lib/clientApi/monitor";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { Monitor } from "./monitor";

export interface IMonitorContainerRenderProps {
  monitor: IMonitor;
}

export interface IMonitorContainerProps {
  orgId: string;
  appId: string;
  monitorId: string;
  render?: (response: IMonitorContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function MonitorContainer(props: IMonitorContainerProps) {
  const { orgId, appId, monitorId, renderLoading, renderError } = props;
  const getMonitorHook = useGetMonitor({ orgId, appId, monitorId });

  const error = getMonitorHook.error;
  const isLoading = getMonitorHook.isLoading;
  const data = useMemo((): IMonitorContainerRenderProps | undefined => {
    if (getMonitorHook.data) {
      return {
        monitor: getMonitorHook.data.monitor,
      };
    }
  }, [getMonitorHook.data]);

  const defaultRender = useCallback(
    (response: IMonitorContainerRenderProps) => (
      <Monitor monitor={response.monitor} />
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
