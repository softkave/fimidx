import {
  createMonitorSchema,
  deleteMonitorSchema,
  GetMonitorByIdEndpointArgs,
  GetMonitorsEndpointArgs,
  ICreateMonitorEndpointResponse,
  IGetMonitorByIdEndpointResponse,
  IGetMonitorsEndpointResponse,
  IUpdateMonitorEndpointResponse,
  updateMonitorSchema,
} from "fmdx-core/definitions/monitor";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kMonitorSWRKeys } from "./swrkeys.ts";
import {
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addMonitor(
  key: ReturnType<typeof kMonitorSWRKeys.addMonitor>,
  params: {
    arg: z.infer<typeof createMonitorSchema>;
  }
) {
  const res = await fetch(key, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<ICreateMonitorEndpointResponse>(res);
}

export type AddMonitorOnSuccessParams = [
  params: Parameters<typeof addMonitor>,
  res: Awaited<ReturnType<typeof addMonitor>>
];

export function useAddMonitor(
  opts: IUseMutationHandlerOpts<typeof addMonitor> & {
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(addMonitor, {
    ...opts,
    invalidate: [
      kMonitorSWRKeys.getMonitors({ appId: opts.appId }),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMonitorSWRKeys.addMonitor(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getMonitors(
  key: ReturnType<typeof kMonitorSWRKeys.getMonitors>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<IGetMonitorsEndpointResponse>(res);
}

export function useGetMonitors(opts: GetMonitorsEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kMonitorSWRKeys.getMonitors(opts),
    getMonitors
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getMonitor(
  key: ReturnType<typeof kMonitorSWRKeys.getMonitorById>
) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<IGetMonitorByIdEndpointResponse>(res);
}

export function useGetMonitor(opts: GetMonitorByIdEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kMonitorSWRKeys.getMonitorById(opts.id),
    getMonitor
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateMonitor(
  key: ReturnType<typeof kMonitorSWRKeys.updateMonitor>,
  params: {
    arg: z.infer<typeof updateMonitorSchema>;
  }
) {
  const res = await fetch(key, {
    method: "PATCH",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<IUpdateMonitorEndpointResponse>(res);
}

export type UpdateMonitorOnSuccessParams = [
  params: Parameters<typeof updateMonitor>,
  res: Awaited<ReturnType<typeof updateMonitor>>
];

export function useUpdateMonitor(
  opts: IUseMutationHandlerOpts<typeof updateMonitor> & {
    appId: string;
    monitorId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateMonitor, {
    ...opts,
    invalidate: [
      kMonitorSWRKeys.getMonitors({ appId: opts.appId }),
      kMonitorSWRKeys.getMonitorById(opts.monitorId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMonitorSWRKeys.updateMonitor(opts.monitorId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteMonitor(
  key: ReturnType<typeof kMonitorSWRKeys.deleteMonitor>,
  params: {
    arg: z.infer<typeof deleteMonitorSchema>;
  }
) {
  const res = await fetch(key, {
    method: "DELETE",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse(res);
}

export type DeleteMonitorOnSuccessParams = [
  params: Parameters<typeof deleteMonitor>,
  res: Awaited<ReturnType<typeof deleteMonitor>>
];

export function useDeleteMonitor(
  opts: IUseMutationHandlerOpts<typeof deleteMonitor> & {
    appId: string;
    monitorId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteMonitor, {
    ...opts,
    invalidate: [
      kMonitorSWRKeys.getMonitors({ appId: opts.appId }),
      kMonitorSWRKeys.getMonitorById(opts.monitorId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMonitorSWRKeys.deleteMonitor(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
