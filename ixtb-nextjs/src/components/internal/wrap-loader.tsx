"use client";

import { cn } from "@/src/lib/utils.ts";
import { isString } from "lodash-es";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageError } from "./error.tsx";
import { PageLoading } from "./loading.tsx";

export interface IWrapLoaderProps<T = unknown> {
  render: (data: T) => React.ReactNode;
  isLoading: boolean;
  error?: unknown;
  data?: T;
  showLoading?: boolean;
  showError?: boolean;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: unknown) => React.ReactNode;
  loadingClassName?: string;
  errorClassName?: string;
  errorVariant?: "default" | "secondary";
  loadingVariant?: "default" | "secondary";
}

export function WrapLoader<T>({
  render,
  isLoading,
  error,
  data,
  showLoading = true,
  showError = true,
  renderLoading,
  renderError,
  loadingClassName,
  errorClassName,
  errorVariant = "secondary",
  loadingVariant = "secondary",
}: IWrapLoaderProps<T>) {
  const toastRef = useRef<ReturnType<typeof toast> | null>(null);

  useEffect(() => {
    if (data) {
      if (toastRef.current) {
        toast.dismiss(toastRef.current);
      }

      if (isLoading) {
        toastRef.current = toast("Loading...", {
          description: "Fetching latest data",
          duration: Infinity,
        });
      } else if (error) {
        toastRef.current = toast("Error", {
          description: isString((error as Error | undefined)?.message)
            ? (error as Error).message
            : "An error occurred",
          duration: Infinity,
        });
      }

      return () => {
        if (toastRef.current) {
          toast.dismiss(toastRef.current);
        }
      };
    }
  }, [data, isLoading, error]);

  if (data) {
    return render(data);
  } else if (isLoading && showLoading) {
    return renderLoading ? (
      renderLoading()
    ) : (
      <PageLoading
        className={cn("max-w-lg mx-auto", loadingClassName)}
        variant={loadingVariant}
      />
    );
  } else if (error && showError) {
    return renderError ? (
      renderError(error)
    ) : (
      <PageError
        error={error}
        className={cn("max-w-lg mx-auto", errorClassName)}
        variant={errorVariant}
      />
    );
  }

  return null;
}
