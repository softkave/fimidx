"use client";

import { useGetLogById } from "@/src/lib/clientApi/log";
import { IFetchedLog } from "fmdx-core/definitions/log";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { Log } from "./log";

export interface ILogContainerRenderProps {
  log: IFetchedLog;
}

export interface ILogContainerProps {
  logId: string;
  render?: (response: ILogContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function LogContainer(props: ILogContainerProps) {
  const { logId, renderLoading, renderError } = props;
  const getLogHook = useGetLogById({ logId });

  const error = getLogHook.error;
  const isLoading = getLogHook.isLoading;
  const data = useMemo((): ILogContainerRenderProps | undefined => {
    if (getLogHook.data) {
      return {
        log: getLogHook.data.log,
      };
    }
  }, [getLogHook.data]);

  const defaultRender = useCallback(
    (response: ILogContainerRenderProps) => <Log log={response.log} />,
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
