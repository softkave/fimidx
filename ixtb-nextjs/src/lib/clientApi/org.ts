import {
  AddOrgEndpointResponse,
  addOrgSchema,
  GetOrgEndpointResponse,
  GetOrgsEndpointResponse,
  UpdateOrgEndpointResponse,
  updateOrgSchema,
} from "@/src/definitions/org.ts";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kApiOrgSWRKeys } from "./keys.ts";
import {
  getRegExpForSWRKey,
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addOrg(
  url: string,
  params: {
    arg: z.infer<typeof addOrgSchema>;
  }
) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<AddOrgEndpointResponse>(res);
}

export type AddOrgOnSuccessParams = [
  params: Parameters<typeof addOrg>,
  res: Awaited<ReturnType<typeof addOrg>>
];

export function useAddOrg(opts: IUseMutationHandlerOpts<typeof addOrg> = {}) {
  const mutationHandler = useMutationHandler(addOrg, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiOrgSWRKeys.getOrgs()),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiOrgSWRKeys.addOrg,
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getOrgs(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetOrgsEndpointResponse>(res);
}

export function useGetOrgs(opts: { page?: number; limit?: number } = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiOrgSWRKeys.getOrgs(opts.page, opts.limit),
    getOrgs
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getOrg(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetOrgEndpointResponse>(res);
}

export function useGetOrg(opts: { orgId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiOrgSWRKeys.getOrg(opts.orgId),
    getOrg
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateOrg(
  url: string,
  params: {
    arg: z.infer<typeof updateOrgSchema>;
  }
) {
  const res = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<UpdateOrgEndpointResponse>(res);
}

export type UpdateOrgOnSuccessParams = [
  params: Parameters<typeof updateOrg>,
  res: Awaited<ReturnType<typeof updateOrg>>
];

export function useUpdateOrg(
  opts: IUseMutationHandlerOpts<typeof updateOrg> & { orgId: string }
) {
  const mutationHandler = useMutationHandler(updateOrg, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiOrgSWRKeys.getOrgs()),
      kApiOrgSWRKeys.getOrg(opts.orgId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiOrgSWRKeys.updateOrg(opts.orgId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteOrg(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  return await handleResponse(res);
}

export type DeleteOrgOnSuccessParams = [
  params: Parameters<typeof deleteOrg>,
  res: Awaited<ReturnType<typeof deleteOrg>>
];

export function useDeleteOrg(
  opts: IUseMutationHandlerOpts<typeof deleteOrg> & { orgId: string }
) {
  const mutationHandler = useMutationHandler(deleteOrg, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiOrgSWRKeys.getOrgs()),
      kApiOrgSWRKeys.getOrg(opts.orgId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiOrgSWRKeys.deleteOrg(opts.orgId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
