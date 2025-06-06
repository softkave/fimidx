import {
  AddAppEndpointResponse,
  addAppSchema,
  deleteAppSchema,
  GetAppEndpointResponse,
  GetAppsEndpointResponse,
  UpdateAppEndpointResponse,
  updateAppSchema,
} from "fmdx-core/definitions/app";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kAppSWRKeys } from "./swrkeys.ts";
import {
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addApp(
  key: ReturnType<typeof kAppSWRKeys.addApp>,
  params: {
    arg: z.infer<typeof addAppSchema>;
  }
) {
  const res = await fetch(key, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<AddAppEndpointResponse>(res);
}

export type AddAppOnSuccessParams = [
  params: Parameters<typeof addApp>,
  res: Awaited<ReturnType<typeof addApp>>
];

export function useAddApp(
  opts: IUseMutationHandlerOpts<typeof addApp> & {
    groupId: string;
  }
) {
  const mutationHandler = useMutationHandler(addApp, {
    ...opts,
    invalidate: [
      kAppSWRKeys.getApps({ groupId: opts.groupId }),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kAppSWRKeys.addApp(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getApps(key: ReturnType<typeof kAppSWRKeys.getApps>) {
  const [url, opts] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(opts),
  });

  return await handleResponse<GetAppsEndpointResponse>(res);
}

export function useGetApps(opts: {
  page?: number;
  limit?: number;
  groupId: string;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kAppSWRKeys.getApps({
      groupId: opts.groupId,
      page: opts.page,
      limit: opts.limit,
    }),
    getApps
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getApp(key: ReturnType<typeof kAppSWRKeys.getApp>) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<GetAppEndpointResponse>(res);
}

export function useGetApp(opts: { appId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kAppSWRKeys.getApp(opts.appId),
    getApp
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateApp(
  key: ReturnType<typeof kAppSWRKeys.updateApp>,
  params: {
    arg: z.infer<typeof updateAppSchema>;
  }
) {
  const res = await fetch(key, {
    method: "PATCH",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<UpdateAppEndpointResponse>(res);
}

export type UpdateAppOnSuccessParams = [
  params: Parameters<typeof updateApp>,
  res: Awaited<ReturnType<typeof updateApp>>
];

export function useUpdateApp(
  opts: IUseMutationHandlerOpts<typeof updateApp> & {
    appId: string;
    groupId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateApp, {
    ...opts,
    invalidate: [
      kAppSWRKeys.getApps({ groupId: opts.groupId }),
      kAppSWRKeys.getApp(opts.appId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kAppSWRKeys.updateApp(opts.appId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteApp(
  key: ReturnType<typeof kAppSWRKeys.deleteApp>,
  params: {
    arg: z.infer<typeof deleteAppSchema>;
  }
) {
  const res = await fetch(key, {
    method: "DELETE",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse(res);
}

export type DeleteAppOnSuccessParams = [
  params: Parameters<typeof deleteApp>,
  res: Awaited<ReturnType<typeof deleteApp>>
];

export function useDeleteApp(
  opts: IUseMutationHandlerOpts<typeof deleteApp> & {
    appId: string;
    groupId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteApp, {
    ...opts,
    invalidate: [
      kAppSWRKeys.getApps({ groupId: opts.groupId }),
      kAppSWRKeys.getApp(opts.appId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kAppSWRKeys.deleteApp(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
