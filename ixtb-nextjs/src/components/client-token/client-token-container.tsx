"use client";

import { useGetClientTokens } from "@/src/lib/clientApi/clientToken";
import {
  getClientTokensSchema,
  IClientToken,
} from "fmdx-core/definitions/clientToken";
import { kId0 } from "fmdx-core/definitions/system";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { WrapLoader } from "../internal/wrap-loader";
import { ClientToken } from "./client-token";

export interface IClientTokenContainerRenderProps {
  clientToken: IClientToken;
}

export interface IClientTokenContainerProps {
  appId: string;
  clientTokenId: string;
  render?: (response: IClientTokenContainerRenderProps) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
}

export function ClientTokenContainer(props: IClientTokenContainerProps) {
  const { appId, clientTokenId, renderLoading, renderError } = props;

  const args = useMemo(
    (): z.infer<typeof getClientTokensSchema> => ({
      page: 1,
      limit: 1,
      query: {
        appId: kId0,
        id: {
          eq: clientTokenId,
        },
      },
    }),
    [clientTokenId, appId]
  );

  const clientTokenHook = useGetClientTokens(args);

  const error = clientTokenHook.error;
  const isLoading = clientTokenHook.isLoading;
  const data = useMemo((): IClientTokenContainerRenderProps | undefined => {
    if (clientTokenHook.data) {
      return {
        clientToken: clientTokenHook.data.clientTokens[0],
      };
    }
  }, [clientTokenHook.data]);

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
