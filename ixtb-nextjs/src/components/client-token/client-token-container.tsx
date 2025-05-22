"use client";

import { useGetClientToken } from "@/src/lib/clientApi/clientToken";
import { IClientToken } from "fmdx-core/definitions/clientToken";
import { useCallback, useMemo } from "react";
import { WrapLoader } from "../internal/wrap-loader";
import { ClientToken } from "./client-token";

export interface IClientTokenContainerRenderProps {
  clientToken: IClientToken;
}

export interface IClientTokenContainerProps {
  clientTokenId: string;
  render?: (response: IClientTokenContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function ClientTokenContainer(props: IClientTokenContainerProps) {
  const { clientTokenId, renderLoading, renderError } = props;
  const getClientTokenHook = useGetClientToken({ clientTokenId });

  const error = getClientTokenHook.error;
  const isLoading = getClientTokenHook.isLoading;
  const data = useMemo((): IClientTokenContainerRenderProps | undefined => {
    if (getClientTokenHook.data) {
      return {
        clientToken: getClientTokenHook.data.clientToken,
      };
    }
  }, [getClientTokenHook.data]);

  const defaultRender = useCallback(
    (response: IClientTokenContainerRenderProps) => (
      <ClientToken clientToken={response.clientToken} />
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
