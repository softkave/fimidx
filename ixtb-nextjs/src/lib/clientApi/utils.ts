"use client";

import { first, isArray, isFunction, isObject, isString } from "lodash-es";
import { useCallback, useMemo } from "react";
import { AnyFn, OrArray, convertToArray } from "softkave-js-utils";
import { toast } from "sonner";
import { Arguments, Key as SWRKey, useSWRConfig } from "swr";

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

/**
 * Options for configuring mutation handler behavior
 */
export interface IUseMutationHandlerOpts<TFn extends AnyFn = AnyFn> {
  /** Callback(s) to execute on successful mutation */
  onSuccess?: OrArray<
    AnyFn<[params: Parameters<TFn>, res: Awaited<ReturnType<TFn>>], void>
  >;
  /** Callback(s) to execute when mutation fails */
  onError?: OrArray<AnyFn<[error: unknown, params: Parameters<TFn>], void>>;
  /** Callback(s) to execute after mutation completes (success or failure) */
  onFinally?: OrArray<AnyFn<[params: Parameters<TFn>], void>>;
  /**
   * SWR cache keys to invalidate after successful mutation. Can be a string,
   * RegExp, function, or array of these. Function receives the current key and
   * mutation params to determine if invalidation should occur.
   */
  invalidate?: OrArray<
    | string
    | RegExp
    | AnyFn<[Arguments, params: Parameters<TFn>], boolean>
    | SWRKey
  >;
  /** Whether to show error toast notifications (defaults to true) */
  showToast?: boolean;
}

/**
 * Hook to handle mutation operations with automatic error handling and cache
 * invalidation
 * @param trigger The mutation function to execute
 * @param opts Configuration options for the mutation handler
 */
export function useMutationHandler<TFn extends AnyFn>(
  trigger: TFn,
  opts: IUseMutationHandlerOpts<TFn> = {}
) {
  const showToast = opts.showToast ?? true;
  const { mutate } = useSWRConfig();

  /**
   * Function to handle cache invalidation after successful mutation. Uses a
   * small timeout to ensure mutation completes before invalidation
   */
  const invalidateFn = useCallback(
    (params: Parameters<TFn>) => {
      setTimeout(() => {
        const invalidateList = convertToArray(opts.invalidate);
        if (invalidateList.length === 0) return;

        mutate((key) => {
          return invalidateList.some((invalidate) => {
            // Handle function-based invalidation
            if (isFunction(invalidate)) return invalidate(key, params);

            // Handle string-based invalidation
            if (isString(invalidate) && key) {
              if (isString(key)) return key === invalidate;
              if (isArray(key))
                return key.some((k) => isString(k) && k === invalidate);
            }

            // Handle RegExp-based invalidation
            if (invalidate instanceof RegExp) {
              if (isString(key)) return invalidate.test(key);
              if (isArray(key))
                return key.some((k) => isString(k) && invalidate.test(k));
            }

            // Handle array-based invalidation with deep comparison
            if (isArray(invalidate)) {
              if (isString(key)) return first(invalidate) === key;
              if (isArray(key)) {
                return invalidate.every((invalidateValue, index) => {
                  const keyValue = key[index];
                  // Deep compare objects if both values are objects
                  if (isObject(invalidateValue) && isObject(keyValue)) {
                    return Object.keys(invalidateValue).every((k) => {
                      return (
                        JSON.stringify(
                          invalidateValue[k as keyof typeof invalidateValue]
                        ) ===
                        JSON.stringify(keyValue[k as keyof typeof keyValue])
                      );
                    });
                  }

                  // Simple comparison for non-object values
                  return (
                    JSON.stringify(invalidateValue) === JSON.stringify(keyValue)
                  );
                });
              }
            }
            return false;
          });
        });
      }, 5);
    },
    [mutate, opts.invalidate]
  );

  // Combine user-provided success handlers with invalidation
  const onSuccess = useMemo(() => {
    return convertToArray(opts.onSuccess).concat(invalidateFn);
  }, [opts.onSuccess, invalidateFn]);

  // Return the wrapped mutation function with error handling and callbacks
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

/**
 * Sanitizes an SWR key string for use in a RegExp by escaping special characters
 */
export function sanitizeSWRKeyForRegExp(key: string) {
  return key.replace("?", "\\?");
}

/**
 * Creates a RegExp object from an SWR key string
 */
export function getRegExpForSWRKey(key: string) {
  return new RegExp(`${sanitizeSWRKeyForRegExp(key)}`);
}
