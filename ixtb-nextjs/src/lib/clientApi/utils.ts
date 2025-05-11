"use client";

import { isArray, isFunction, isString } from "lodash-es";
import { useCallback, useMemo } from "react";
import { AnyFn, OrArray, convertToArray } from "softkave-js-utils";
import { toast } from "sonner";
import { Arguments, useSWRConfig } from "swr";

export async function handleResponseError(res: Response) {
  if (res.status !== 200) {
    const json = await res.json();
    // TODO: map server zod errors to fields, and other error fields
    throw new Error(isString(json.message) ? json.message : "Unknown error");
  }
}

export async function handleResponseSuccess<T>(res: Response) {
  const json = await res.json();
  return json as T;
}

export async function handleResponse<T>(res: Response) {
  await handleResponseError(res);
  return handleResponseSuccess<T>(res);
}

export interface IUseMutationHandlerOpts<TFn extends AnyFn = AnyFn> {
  onSuccess?: OrArray<
    AnyFn<[params: Parameters<TFn>, res: Awaited<ReturnType<TFn>>], void>
  >;
  onError?: OrArray<AnyFn<[error: unknown, params: Parameters<TFn>], void>>;
  onFinally?: OrArray<AnyFn<[params: Parameters<TFn>], void>>;
  invalidate?: OrArray<
    string | RegExp | AnyFn<[Arguments, params: Parameters<TFn>], boolean>
  >;
  showToast?: boolean;
}

export function useMutationHandler<TFn extends AnyFn>(
  trigger: TFn,
  opts: IUseMutationHandlerOpts<TFn> = {}
) {
  const showToast = opts.showToast ?? true;
  const { mutate } = useSWRConfig();
  const invalidateFn = useCallback(
    (params: Parameters<TFn>) => {
      setTimeout(() => {
        const invalidateList = convertToArray(opts.invalidate);
        if (invalidateList.length === 0) return;

        mutate((key) => {
          return invalidateList.some((invalidate) => {
            if (isFunction(invalidate)) return invalidate(key, params);
            if (isString(invalidate) && key) {
              if (isString(key)) return key.includes(invalidate);
              if (isArray(key))
                return key.some((k) => isString(k) && k.includes(invalidate));
            }
            if (invalidate instanceof RegExp) {
              if (isString(key)) return invalidate.test(key);
              if (isArray(key)) return key.some((k) => invalidate.test(k));
            }
            return false;
          });
        });
      }, 5);
    },
    [mutate, opts.invalidate]
  );

  const onSuccess = useMemo(() => {
    return convertToArray(opts.onSuccess).concat(invalidateFn);
  }, [opts.onSuccess, invalidateFn]);

  return useCallback(
    async (...args: Parameters<TFn>): Promise<Awaited<ReturnType<TFn>>> => {
      try {
        const res = await trigger(...args);
        onSuccess.forEach((fn) => fn?.(args, res));
        return res;
      } catch (error) {
        console.error(error);
        convertToArray(opts.onError)?.forEach((fn) => fn?.(error, args));
        if (showToast) {
          toast.error("Error", {
            description: isString((error as Error | undefined)?.message)
              ? (error as Error).message
              : "An error occurred",
          });
        }

        throw error;
      } finally {
        convertToArray(opts.onFinally)?.forEach((fn) => fn?.(args));
      }
    },
    [trigger, onSuccess, opts.onError, opts.onFinally, showToast]
  );
}

export function sanitizeSWRKeyForRegExp(key: string) {
  return key.replace("?", "\\?");
}

export function getRegExpForSWRKey(key: string) {
  return new RegExp(`${sanitizeSWRKeyForRegExp(key)}`);
}
