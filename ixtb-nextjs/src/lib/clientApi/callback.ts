import {
  addCallbackSchema,
  deleteCallbackSchema,
  GetCallbackEndpointArgs,
  GetCallbacksEndpointArgs,
  IAddCallbackEndpointResponse,
  IGetCallbackEndpointResponse,
  IGetCallbacksEndpointResponse,
} from "fmdx-core/definitions/callback";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kCallbackSWRKeys } from "./swrkeys.ts";
import {
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addCallback(
  key: ReturnType<typeof kCallbackSWRKeys.addCallback>,
  params: {
    arg: z.infer<typeof addCallbackSchema>;
  }
) {
  const res = await fetch(key, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<IAddCallbackEndpointResponse>(res);
}

export type AddCallbackOnSuccessParams = [
  params: Parameters<typeof addCallback>,
  res: Awaited<ReturnType<typeof addCallback>>
];

export function useAddCallback(
  opts: IUseMutationHandlerOpts<typeof addCallback> & {
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(addCallback, {
    ...opts,
    invalidate: [
      kCallbackSWRKeys.getCallbacks({ appId: opts.appId }),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kCallbackSWRKeys.addCallback(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getCallbacks(
  key: ReturnType<typeof kCallbackSWRKeys.getCallbacks>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<IGetCallbacksEndpointResponse>(res);
}

export function useGetCallbacks(opts: GetCallbacksEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kCallbackSWRKeys.getCallbacks(opts),
    getCallbacks
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getCallback(
  key: ReturnType<typeof kCallbackSWRKeys.getCallbackById>
) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<IGetCallbackEndpointResponse>(res);
}

export function useGetCallback(opts: GetCallbackEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kCallbackSWRKeys.getCallbackById(opts.id),
    getCallback
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function deleteCallback(
  key: ReturnType<typeof kCallbackSWRKeys.deleteCallback>,
  params: {
    arg: z.infer<typeof deleteCallbackSchema>;
  }
) {
  const res = await fetch(key, {
    method: "DELETE",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse(res);
}

export type DeleteCallbackOnSuccessParams = [
  params: Parameters<typeof deleteCallback>,
  res: Awaited<ReturnType<typeof deleteCallback>>
];

export function useDeleteCallback(
  opts: IUseMutationHandlerOpts<typeof deleteCallback> & {
    appId: string;
    callbackId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteCallback, {
    ...opts,
    invalidate: [
      kCallbackSWRKeys.getCallbacks({ appId: opts.appId }),
      kCallbackSWRKeys.getCallbackById(opts.callbackId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kCallbackSWRKeys.deleteCallback(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
