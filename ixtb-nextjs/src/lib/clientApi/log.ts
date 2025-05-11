import {
  GetLogByIdEndpointResponse,
  GetLogFieldsEndpointResponse,
  GetLogFieldValuesEndpointArgs,
  GetLogFieldValuesEndpointResponse,
  GetLogsEndpointArgs,
  GetLogsEndpointResponse,
} from "@/src/definitions/log";
import useSWR from "swr";
import { kApiLogSWRKeys } from "./keys";
import { handleResponse } from "./utils";

export async function getLogs([url, args]: [
  url: string,
  args: GetLogsEndpointArgs
]) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<GetLogsEndpointResponse>(res);
}

export function useGetLogs(opts: {
  orgId: string;
  appId: string;
  args: GetLogsEndpointArgs;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [kApiLogSWRKeys.retrieve(opts.orgId, opts.appId), opts.args],
    getLogs,
    {
      keepPreviousData: true,
    }
  );

  return { data, error, isLoading, isValidating, mutate };
}

export async function getLogFields(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetLogFieldsEndpointResponse>(res);
}

export function useGetLogFields(opts: { orgId: string; appId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiLogSWRKeys.getLogFields(opts.orgId, opts.appId),
    getLogFields
  );

  return { data, error, isLoading, isValidating, mutate };
}

export async function getLogById(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetLogByIdEndpointResponse>(res);
}

export function useGetLogById(opts: {
  orgId: string;
  appId: string;
  logId: string;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiLogSWRKeys.getLogById(opts.orgId, opts.appId, opts.logId),
    getLogById
  );

  return { data, error, isLoading, isValidating, mutate };
}

export async function getLogFieldValues([url, args]: [
  url: string,
  args: GetLogFieldValuesEndpointArgs
]) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<GetLogFieldValuesEndpointResponse>(res);
}

export function useGetLogFieldValues(opts: {
  orgId: string;
  appId: string;
  args: GetLogFieldValuesEndpointArgs;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [
      kApiLogSWRKeys.getLogFieldValues(
        opts.orgId,
        opts.appId,
        opts.args.page,
        opts.args.limit
      ),
      opts.args,
    ],
    getLogFieldValues
  );

  return { data, error, isLoading, isValidating, mutate };
}
