"use client";

import { useGetClientTokens } from "@/src/lib/clientApi/clientToken.ts";
import { cn } from "@/src/lib/utils.ts";
import {
  GetClientTokensEndpointArgs,
  IClientToken,
} from "fmdx-core/definitions/clientToken";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { ClientTokens } from "./client-tokens-list.tsx";

export type IClientTokenListContainerFilter = OmitFrom<
  GetClientTokensEndpointArgs,
  "page" | "limit"
>;

export interface IClientTokenListContainerProps {
  render?: (clientTokens: IClientToken[]) => React.ReactNode;
  showNoClientTokensMessage?: boolean;
  filter?: IClientTokenListContainerFilter;
  className?: string;
  clientTokensContainerClassName?: string;
  appId: string;
}

export function ClientTokenListContainer({
  render: inputRender,
  showNoClientTokensMessage = true,
  filter,
  className,
  clientTokensContainerClassName,
  appId,
}: IClientTokenListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const clientTokenHooks = useGetClientTokens({
    appId: appId,
    page,
    limit: pageSize,
    ...filter,
  });

  const defaultRender = (clientTokens: IClientToken[]) => {
    return <ClientTokens clientTokens={clientTokens} />;
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={clientTokenHooks.isLoading}
        error={clientTokenHooks.error}
        data={clientTokenHooks.data}
        render={(data) =>
          data.clientTokens.length === 0 && showNoClientTokensMessage ? (
            <PageMessage
              title="No clientTokens"
              message="No clientTokens found"
              className="px-4 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                clientTokensContainerClassName
              )}
            >
              {render(data.clientTokens)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={clientTokenHooks.isLoading}
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
