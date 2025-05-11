import {
  addMemberSchema,
  IAddMemberEndpointResponse,
  IGetMemberEndpointResponse,
  IGetMembersEndpointResponse,
  IGetUserMemberRequestsEndpointResponse,
  IRespondToMemberRequestEndpointResponse,
  IUpdateMemberEndpointResponse,
  respondToMemberRequestSchema,
  updateMemberSchema,
} from "@/src/definitions/members.ts";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kApiMemberSWRKeys } from "./keys.ts";
import {
  getRegExpForSWRKey,
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addMember(
  url: string,
  params: {
    arg: z.infer<typeof addMemberSchema>;
  }
) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<IAddMemberEndpointResponse>(res);
}

export type AddMemberOnSuccessParams = [
  params: Parameters<typeof addMember>,
  res: Awaited<ReturnType<typeof addMember>>
];

export function useAddMember(
  opts: IUseMutationHandlerOpts<typeof addMember> & { orgId: string }
) {
  const mutationHandler = useMutationHandler(addMember, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiMemberSWRKeys.getMembers(opts.orgId)),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMemberSWRKeys.addMember(opts.orgId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getMembers(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<IGetMembersEndpointResponse>(res);
}

export function useGetMembers(opts: {
  orgId: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiMemberSWRKeys.getMembers(opts.orgId, opts.page, opts.limit),
    getMembers
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getMemberByUserId(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<IGetMemberEndpointResponse>(res);
}

export function useGetMemberByUserId(opts: {
  orgId: string;
  memberUserId?: string;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    opts.memberUserId
      ? kApiMemberSWRKeys.getMemberByUserId(opts.orgId, opts.memberUserId)
      : null,
    getMemberByUserId
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getMemberById(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<IGetMemberEndpointResponse>(res);
}

export function useGetMemberById(opts: { orgId: string; memberId?: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    opts.memberId
      ? kApiMemberSWRKeys.getMemberById(opts.orgId, opts.memberId)
      : null,
    getMemberById
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateMemberById(
  url: string,
  params: {
    arg: z.infer<typeof updateMemberSchema>;
  }
) {
  const res = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<IUpdateMemberEndpointResponse>(res);
}

export type UpdateMemberOnSuccessParams = [
  params: Parameters<typeof updateMemberById>,
  res: Awaited<ReturnType<typeof updateMemberById>>
];

export function useUpdateMemberById(
  opts: IUseMutationHandlerOpts<typeof updateMemberById> & {
    orgId: string;
    memberId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateMemberById, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiMemberSWRKeys.getMembers(opts.orgId)),
      getRegExpForSWRKey(kApiMemberSWRKeys.getMemberByUserId(opts.orgId, ".*")),
      kApiMemberSWRKeys.getMemberById(opts.orgId, opts.memberId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMemberSWRKeys.updateMemberById(opts.orgId, opts.memberId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteMemberById(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  return await handleResponse(res);
}

export type DeleteMemberByIdOnSuccessParams = [
  params: Parameters<typeof deleteMemberById>,
  res: Awaited<ReturnType<typeof deleteMemberById>>
];

export function useDeleteMemberById(
  opts: IUseMutationHandlerOpts<typeof deleteMemberById> & {
    orgId: string;
    memberId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteMemberById, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiMemberSWRKeys.getMembers(opts.orgId)),
      getRegExpForSWRKey(kApiMemberSWRKeys.getMemberByUserId(opts.orgId, ".*")),
      kApiMemberSWRKeys.getMemberById(opts.orgId, opts.memberId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMemberSWRKeys.removeMemberById(opts.orgId, opts.memberId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function getUserRequests(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<IGetUserMemberRequestsEndpointResponse>(res);
}

export function useGetUserRequests(opts: { page?: number; limit?: number }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiMemberSWRKeys.getUserRequests(opts.page, opts.limit),
    getUserRequests
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function respondToMemberRequest(
  url: string,
  params: {
    arg: z.infer<typeof respondToMemberRequestSchema>;
  }
) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<IRespondToMemberRequestEndpointResponse>(res);
}

export type RespondToMemberRequestOnSuccessParams = [
  params: Parameters<typeof respondToMemberRequest>,
  res: Awaited<ReturnType<typeof respondToMemberRequest>>
];

export function useRespondToMemberRequest(
  opts: IUseMutationHandlerOpts<typeof respondToMemberRequest> & {
    orgId: string;
    memberId: string;
  }
) {
  const mutationHandler = useMutationHandler(respondToMemberRequest, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(kApiMemberSWRKeys.getUserRequests()),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiMemberSWRKeys.respondToMemberRequest(opts.orgId, opts.memberId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
