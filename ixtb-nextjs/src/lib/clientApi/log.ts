import {
  GetLogByIdEndpointResponse,
  GetLogFieldsEndpointArgs,
  GetLogFieldsEndpointResponse,
  GetLogFieldValuesEndpointArgs,
  GetLogFieldValuesEndpointResponse,
  GetLogsEndpointArgs,
  GetLogsEndpointResponse,
} from "fmdx-core/definitions/log";
import useSWR from "swr";
import { kLogSWRKeys } from "./swrkeys";
import { handleResponse } from "./utils";

export async function getLogs(key: ReturnType<typeof kLogSWRKeys.retrieve>) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<GetLogsEndpointResponse>(res);
}

export function useGetLogs(opts: GetLogsEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kLogSWRKeys.retrieve(opts),
    getLogs,
    {
      keepPreviousData: true,
    }
  );

  return { data, error, isLoading, isValidating, mutate };
}

export async function getLogFields(
  key: ReturnType<typeof kLogSWRKeys.getLogFields>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<GetLogFieldsEndpointResponse>(res);
}

export function useGetLogFields(opts: GetLogFieldsEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kLogSWRKeys.getLogFields(opts),
    getLogFields
  );

  return { data, error, isLoading, isValidating, mutate };
}

export async function getLogById(
  key: ReturnType<typeof kLogSWRKeys.getLogById>
) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<GetLogByIdEndpointResponse>(res);
}

export function useGetLogById(opts: { logId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kLogSWRKeys.getLogById(opts.logId),
    getLogById
  );

  return { data, error, isLoading, isValidating, mutate };
}

export async function getLogFieldValues(
  key: ReturnType<typeof kLogSWRKeys.getLogFieldValues>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<GetLogFieldValuesEndpointResponse>(res);
}

export function useGetLogFieldValues(opts: GetLogFieldValuesEndpointArgs) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kLogSWRKeys.getLogFieldValues(opts),
    getLogFieldValues
  );

  return { data, error, isLoading, isValidating, mutate };
}
