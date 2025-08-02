import {
  addMemberSchema,
  GetMemberByUserIdEndpointArgs,
  IAddMemberEndpointResponse,
  IGetMemberEndpointResponse,
  IGetMembersEndpointResponse,
  IGetUserMemberRequestsEndpointResponse,
  IRespondToMemberRequestEndpointResponse,
  IUpdateMemberEndpointResponse,
  removeMemberSchema,
  respondToMemberRequestSchema,
  updateMemberSchema,
} from "fimidx-core/definitions/members";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kApiMemberKeys } from "./apikeys.ts";
import { kMemberSWRKeys } from "./swrkeys.ts";
import {
  getRegExpForSWRKey,
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addMember(
  key: ReturnType<typeof kMemberSWRKeys.addMember>,
  params: {
    arg: z.infer<typeof addMemberSchema>;
  }
) {
  const res = await fetch(key, {
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
      kMemberSWRKeys.getMembers({ orgId: opts.orgId }),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMemberSWRKeys.addMember(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getMembers(
  key: ReturnType<typeof kMemberSWRKeys.getMembers>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<IGetMembersEndpointResponse>(res);
}

export function useGetMembers(opts: {
  orgId: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kMemberSWRKeys.getMembers({
      orgId: opts.orgId,
      page: opts.page,
      limit: opts.limit,
    }),
    getMembers
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getMemberByUserId(
  key: ReturnType<typeof kMemberSWRKeys.getMemberByUserId>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<IGetMemberEndpointResponse>(res);
}

export function useGetMemberByUserId(
  opts: Partial<GetMemberByUserIdEndpointArgs>
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    opts.userId && opts.orgId
      ? kMemberSWRKeys.getMemberByUserId({
          userId: opts.userId,
          orgId: opts.orgId,
        })
      : null,
    getMemberByUserId,
    {
      keepPreviousData: true,
    }
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getMemberById(
  key: ReturnType<typeof kMemberSWRKeys.getMemberById>
) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<IGetMemberEndpointResponse>(res);
}

export function useGetMemberById(opts: { memberId?: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    opts.memberId ? kMemberSWRKeys.getMemberById(opts.memberId) : null,
    getMemberById
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateMemberById(
  key: ReturnType<typeof kMemberSWRKeys.updateMemberById>,
  params: {
    arg: z.infer<typeof updateMemberSchema>;
  }
) {
  const res = await fetch(key, {
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
      kMemberSWRKeys.getMembers({ orgId: opts.orgId }),
      getRegExpForSWRKey(kApiMemberKeys.getMemberByUserId(".*")),
      kMemberSWRKeys.getMemberById(opts.memberId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMemberSWRKeys.updateMemberById(opts.memberId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteMemberById(
  key: ReturnType<typeof kMemberSWRKeys.removeMember>,
  params: {
    arg: z.infer<typeof removeMemberSchema>;
  }
) {
  const res = await fetch(key, {
    method: "DELETE",
    body: JSON.stringify(params.arg),
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
      kMemberSWRKeys.getMembers({ orgId: opts.orgId }),
      kMemberSWRKeys.getMemberById(opts.memberId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMemberSWRKeys.removeMember(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function getUserRequests(
  key: ReturnType<typeof kMemberSWRKeys.getUserRequests>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<IGetUserMemberRequestsEndpointResponse>(res);
}

export function useGetUserRequests(opts: { page?: number; limit?: number }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kMemberSWRKeys.getUserRequests({
      page: opts.page,
      limit: opts.limit,
    }),
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
      kMemberSWRKeys.getUserRequests({}),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kMemberSWRKeys.respondToMemberRequest(opts.memberId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
