import {
  createMonitorSchema,
  ICreateMonitorEndpointResponse,
  IGetMonitorByIdEndpointResponse,
  IGetMonitorsEndpointResponse,
  IUpdateMonitorEndpointResponse,
  updateMonitorSchema,
} from "@/src/definitions/monitor.ts";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kApiMonitorSWRKeys } from "./keys.ts";
import {
  getRegExpForSWRKey,
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addMonitor(
  url: string,
  params: {
    arg: z.infer<typeof createMonitorSchema>;
  }
) {
  const res = await fetch(url, {
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
    orgId: string;
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(addMonitor, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(
        kApiMonitorSWRKeys.getMonitors(opts.orgId, opts.appId)
      ),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMonitorSWRKeys.addMonitor(opts.orgId, opts.appId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getMonitors(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<IGetMonitorsEndpointResponse>(res);
}

export function useGetMonitors(opts: {
  orgId: string;
  appId: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiMonitorSWRKeys.getMonitors(
      opts.orgId,
      opts.appId,
      opts.page,
      opts.limit
    ),
    getMonitors
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getMonitor(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<IGetMonitorByIdEndpointResponse>(res);
}

export function useGetMonitor(opts: {
  orgId: string;
  appId: string;
  monitorId: string;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiMonitorSWRKeys.getMonitorById(opts.orgId, opts.appId, opts.monitorId),
    getMonitor
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateMonitor(
  url: string,
  params: {
    arg: z.infer<typeof updateMonitorSchema>;
  }
) {
  const res = await fetch(url, {
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
    orgId: string;
    appId: string;
    monitorId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateMonitor, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(
        kApiMonitorSWRKeys.getMonitors(opts.orgId, opts.appId)
      ),
      kApiMonitorSWRKeys.getMonitorById(opts.orgId, opts.appId, opts.monitorId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMonitorSWRKeys.updateMonitor(opts.orgId, opts.appId, opts.monitorId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteMonitor(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  return await handleResponse(res);
}

export type DeleteMonitorOnSuccessParams = [
  params: Parameters<typeof deleteMonitor>,
  res: Awaited<ReturnType<typeof deleteMonitor>>
];

export function useDeleteMonitor(
  opts: IUseMutationHandlerOpts<typeof deleteMonitor> & {
    orgId: string;
    appId: string;
    monitorId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteMonitor, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(
        kApiMonitorSWRKeys.getMonitors(opts.orgId, opts.appId)
      ),
      kApiMonitorSWRKeys.getMonitorById(opts.orgId, opts.appId, opts.monitorId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMonitorSWRKeys.deleteMonitor(opts.orgId, opts.appId, opts.monitorId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
