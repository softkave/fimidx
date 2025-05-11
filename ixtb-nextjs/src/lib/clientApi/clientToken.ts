import {
  AddClientTokenEndpointResponse,
  addClientTokenSchema,
  EncodeClientTokenJWTEndpointResponse,
  encodeClientTokenJWTSchema,
  GetClientTokenEndpointResponse,
  GetClientTokensEndpointResponse,
  UpdateClientTokenEndpointResponse,
  updateClientTokenSchema,
} from "@/src/definitions/clientToken.ts";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kApiClientTokenSWRKeys } from "./keys.ts";
import {
  getRegExpForSWRKey,
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addClientToken(
  url: string,
  params: {
    arg: z.infer<typeof addClientTokenSchema>;
  }
) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<AddClientTokenEndpointResponse>(res);
}

export type AddClientTokenOnSuccessParams = [
  params: Parameters<typeof addClientToken>,
  res: Awaited<ReturnType<typeof addClientToken>>
];

export function useAddClientToken(
  opts: IUseMutationHandlerOpts<typeof addClientToken> & {
    orgId: string;
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(addClientToken, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(
        kApiClientTokenSWRKeys.getClientTokens(opts.orgId, opts.appId)
      ),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiClientTokenSWRKeys.addClientToken(opts.orgId, opts.appId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getClientTokens(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetClientTokensEndpointResponse>(res);
}

export function useGetClientTokens(opts: {
  orgId: string;
  appId: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiClientTokenSWRKeys.getClientTokens(
      opts.orgId,
      opts.appId,
      opts.page,
      opts.limit
    ),
    getClientTokens
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getClientToken(url: string) {
  const res = await fetch(url, {
    method: "GET",
  });

  return await handleResponse<GetClientTokenEndpointResponse>(res);
}

export function useGetClientToken(opts: {
  orgId: string;
  appId: string;
  clientTokenId: string;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kApiClientTokenSWRKeys.getClientToken(
      opts.orgId,
      opts.appId,
      opts.clientTokenId
    ),
    getClientToken
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateClientToken(
  url: string,
  params: {
    arg: z.infer<typeof updateClientTokenSchema>;
  }
) {
  const res = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<UpdateClientTokenEndpointResponse>(res);
}

export type UpdateClientTokenOnSuccessParams = [
  params: Parameters<typeof updateClientToken>,
  res: Awaited<ReturnType<typeof updateClientToken>>
];

export function useUpdateClientToken(
  opts: IUseMutationHandlerOpts<typeof updateClientToken> & {
    orgId: string;
    appId: string;
    clientTokenId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateClientToken, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(
        kApiClientTokenSWRKeys.getClientTokens(opts.orgId, opts.appId)
      ),
      kApiClientTokenSWRKeys.getClientToken(
        opts.orgId,
        opts.appId,
        opts.clientTokenId
      ),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiClientTokenSWRKeys.updateClientToken(
      opts.orgId,
      opts.appId,
      opts.clientTokenId
    ),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteClientToken(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  return await handleResponse(res);
}

export type DeleteClientTokenOnSuccessParams = [
  params: Parameters<typeof deleteClientToken>,
  res: Awaited<ReturnType<typeof deleteClientToken>>
];

export function useDeleteClientToken(
  opts: IUseMutationHandlerOpts<typeof deleteClientToken> & {
    orgId: string;
    appId: string;
    clientTokenId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteClientToken, {
    ...opts,
    invalidate: [
      getRegExpForSWRKey(
        kApiClientTokenSWRKeys.getClientTokens(opts.orgId, opts.appId)
      ),
      kApiClientTokenSWRKeys.getClientToken(
        opts.orgId,
        opts.appId,
        opts.clientTokenId
      ),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiClientTokenSWRKeys.deleteClientToken(
      opts.orgId,
      opts.appId,
      opts.clientTokenId
    ),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function encodeClientTokenJWT(
  url: string,
  params: {
    arg: z.infer<typeof encodeClientTokenJWTSchema>;
  }
) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<EncodeClientTokenJWTEndpointResponse>(res);
}

export function useEncodeClientTokenJWT(opts: {
  orgId: string;
  appId: string;
  clientTokenId: string;
}) {
  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kApiClientTokenSWRKeys.encodeClientTokenJWT(
      opts.orgId,
      opts.appId,
      opts.clientTokenId
    ),
    encodeClientTokenJWT
  );

  return { trigger, data, error, isMutating, reset };
}
