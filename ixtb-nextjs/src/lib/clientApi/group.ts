import {
  AddGroupEndpointResponse,
  addGroupSchema,
  deleteGroupSchema,
  GetGroupEndpointResponse,
  GetGroupsEndpointResponse,
  UpdateGroupEndpointResponse,
  updateGroupSchema,
} from "fmdx-core/definitions/group";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kGroupSWRKeys } from "./swrkeys.ts";
import {
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addGroup(
  key: ReturnType<typeof kGroupSWRKeys.addGroup>,
  params: {
    arg: z.infer<typeof addGroupSchema>;
  }
) {
  const res = await fetch(key, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<AddGroupEndpointResponse>(res);
}

export type AddGroupOnSuccessParams = [
  params: Parameters<typeof addGroup>,
  res: Awaited<ReturnType<typeof addGroup>>
];

export function useAddGroup(
  opts: IUseMutationHandlerOpts<typeof addGroup> = {}
) {
  const mutationHandler = useMutationHandler(addGroup, {
    ...opts,
    invalidate: [
      kGroupSWRKeys.getGroups({}),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kGroupSWRKeys.addGroup(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getGroups(
  key: ReturnType<typeof kGroupSWRKeys.getGroups>
) {
  const [url, args] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });

  return await handleResponse<GetGroupsEndpointResponse>(res);
}

export function useGetGroups(opts: { page?: number; limit?: number } = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kGroupSWRKeys.getGroups(opts),
    getGroups
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getGroup(key: ReturnType<typeof kGroupSWRKeys.getGroup>) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<GetGroupEndpointResponse>(res);
}

export function useGetGroup(opts: { groupId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kGroupSWRKeys.getGroup(opts.groupId),
    getGroup
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateGroup(
  key: ReturnType<typeof kGroupSWRKeys.updateGroup>,
  params: {
    arg: z.infer<typeof updateGroupSchema>;
  }
) {
  const res = await fetch(key, {
    method: "PATCH",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<UpdateGroupEndpointResponse>(res);
}

export type UpdateGroupOnSuccessParams = [
  params: Parameters<typeof updateGroup>,
  res: Awaited<ReturnType<typeof updateGroup>>
];

export function useUpdateGroup(
  opts: IUseMutationHandlerOpts<typeof updateGroup> & { groupId: string }
) {
  const mutationHandler = useMutationHandler(updateGroup, {
    ...opts,
    invalidate: [
      kGroupSWRKeys.getGroups({}),
      kGroupSWRKeys.getGroup(opts.groupId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kGroupSWRKeys.updateGroup(opts.groupId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteGroup(
  key: ReturnType<typeof kGroupSWRKeys.deleteGroup>,
  params: {
    arg: z.infer<typeof deleteGroupSchema>;
  }
) {
  const res = await fetch(key, {
    method: "DELETE",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse(res);
}

export type DeleteGroupOnSuccessParams = [
  params: Parameters<typeof deleteGroup>,
  res: Awaited<ReturnType<typeof deleteGroup>>
];

export function useDeleteGroup(
  opts: IUseMutationHandlerOpts<typeof deleteGroup> & { groupId: string }
) {
  const mutationHandler = useMutationHandler(deleteGroup, {
    ...opts,
    invalidate: [
      kGroupSWRKeys.getGroups({}),
      kGroupSWRKeys.getGroup(opts.groupId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kGroupSWRKeys.deleteGroup(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}
