"use client";

import { useGetCallback } from "@/src/lib/clientApi/callback";
import { ICallback } from "fmdx-core/definitions/callback";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { Callback } from "./callback";

export interface ICallbackContainerRenderProps {
  callback: ICallback;
}

export interface ICallbackContainerProps {
  callbackId: string;
  render?: (response: ICallbackContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function CallbackContainer(props: ICallbackContainerProps) {
  const { callbackId, renderLoading, renderError } = props;
  const getCallbackHook = useGetCallback({ id: callbackId });

  const error = getCallbackHook.error;
  const isLoading = getCallbackHook.isLoading;
  const data = useMemo((): ICallbackContainerRenderProps | undefined => {
    if (getCallbackHook.data) {
      return {
        callback: getCallbackHook.data.callback,
      };
    }
  }, [getCallbackHook.data]);

  const defaultRender = useCallback(
    (response: ICallbackContainerRenderProps) => (
      <Callback callback={response.callback} />
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
