"use client";

import { useGetCallbacks } from "@/src/lib/clientApi/callback.ts";
import { cn } from "@/src/lib/utils.ts";
import {
  GetCallbacksEndpointArgs,
  ICallback,
} from "fmdx-core/definitions/callback";
import { useState } from "react";
import { OmitFrom } from "softkave-js-utils";
import ListPagination from "../internal/list-pagination.tsx";
import { PageMessage } from "../internal/page-message.tsx";
import { WrapLoader } from "../internal/wrap-loader.tsx";
import { Callbacks } from "./callbacks-list.tsx";

export type ICallbackListContainerFilter = OmitFrom<
  GetCallbacksEndpointArgs,
  "page" | "limit"
>;

export interface ICallbackListContainerProps {
  render?: (callbacks: ICallback[]) => React.ReactNode;
  showNoCallbacksMessage?: boolean;
  filter?: ICallbackListContainerFilter;
  className?: string;
  callbacksContainerClassName?: string;
  appId: string;
}

export function CallbackListContainer({
  render: inputRender,
  showNoCallbacksMessage = true,
  filter,
  className,
  callbacksContainerClassName,
  appId,
}: ICallbackListContainerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const callbackHooks = useGetCallbacks({
    appId: appId,
    page,
    limit: pageSize,
    ...filter,
  });

  const defaultRender = (callbacks: ICallback[]) => {
    return <Callbacks callbacks={callbacks} />;
  };

  const render = inputRender ?? defaultRender;

  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <WrapLoader
        isLoading={callbackHooks.isLoading}
        error={callbackHooks.error}
        data={callbackHooks.data}
        render={(data) =>
          data.callbacks.length === 0 && showNoCallbacksMessage ? (
            <PageMessage
              title="No callbacks"
              message="No callbacks found"
              className="px-4 flex flex-col items-center justify-center py-32"
            />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center w-full",
                callbacksContainerClassName
              )}
            >
              {render(data.callbacks)}
              <ListPagination
                count={data.total}
                page={page}
                pageSize={pageSize}
                disabled={callbackHooks.isLoading}
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
