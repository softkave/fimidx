import {
  AddAppEndpointResponse,
  addAppSchema,
  GetAppEndpointResponse,
  GetAppsEndpointResponse,
  UpdateAppEndpointResponse,
  updateAppSchema,
} from "@/src/definitions/app.ts";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kApiAppSWRKeys } from "./keys.ts";
import {
  getRegExpForSWRKey,
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addApp(
  url: string,
  params: {
    arg: z.infer<typeof addAppSchema>;
  }
) {
  const res = await fetch(url, {
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
  opts: IUseMutationHandlerOpts<typeof addApp> & { orgId: string }
) {
  const mutationHandler = useMutationHandler(addApp, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiAppSWRKeys.getApps(opts.orgId)),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiAppSWRKeys.addApp(opts.orgId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getApps(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetAppsEndpointResponse>(res);
}

export function useGetApps(opts: {
  orgId: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiAppSWRKeys.getApps(opts.orgId, opts.page, opts.limit),
    getApps
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getApp(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetAppEndpointResponse>(res);
}

export function useGetApp(opts: { orgId: string; appId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiAppSWRKeys.getApp(opts.orgId, opts.appId),
    getApp
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateApp(
  url: string,
  params: {
    arg: z.infer<typeof updateAppSchema>;
  }
) {
  const res = await fetch(url, {
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
    orgId: string;
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateApp, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiAppSWRKeys.getApps(opts.orgId)),
      kApiAppSWRKeys.getApp(opts.orgId, opts.appId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiAppSWRKeys.updateApp(opts.orgId, opts.appId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteApp(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  return await handleResponse(res);
}

export type DeleteAppOnSuccessParams = [
  params: Parameters<typeof deleteApp>,
  res: Awaited<ReturnType<typeof deleteApp>>
];

export function useDeleteApp(
  opts: IUseMutationHandlerOpts<typeof deleteApp> & {
    orgId: string;
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteApp, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiAppSWRKeys.getApps(opts.orgId)),
      kApiAppSWRKeys.getApp(opts.orgId, opts.appId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiAppSWRKeys.deleteApp(opts.orgId, opts.appId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
