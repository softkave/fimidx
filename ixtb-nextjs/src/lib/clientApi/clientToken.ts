import {
  AddClientTokenEndpointResponse,
  addClientTokenSchema,
  deleteClientTokenSchema,
  EncodeClientTokenJWTEndpointResponse,
  encodeClientTokenJWTSchema,
  GetClientTokenEndpointResponse,
  GetClientTokensEndpointResponse,
  UpdateClientTokenEndpointResponse,
  updateClientTokenSchema,
} from "fmdx-core/definitions/clientToken";
import { convertToArray } from "softkave-js-utils";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { kClientTokenSWRKeys } from "./swrkeys.ts";
import {
  handleResponse,
  IUseMutationHandlerOpts,
  useMutationHandler,
} from "./utils.ts";

async function addClientToken(
  key: ReturnType<typeof kClientTokenSWRKeys.addClientToken>,
  params: {
    arg: z.infer<typeof addClientTokenSchema>;
  }
) {
  const res = await fetch(key, {
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
    appId: string;
  }
) {
  const mutationHandler = useMutationHandler(addClientToken, {
    ...opts,
    invalidate: [
      kClientTokenSWRKeys.getClientTokens({
        appId: opts.appId,
      }),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kClientTokenSWRKeys.addClientToken(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

export async function getClientTokens(
  key: ReturnType<typeof kClientTokenSWRKeys.getClientTokens>
) {
  const [url, opts] = key;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(opts),
  });

  return await handleResponse<GetClientTokensEndpointResponse>(res);
}

export function useGetClientTokens(opts: {
  appId: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kClientTokenSWRKeys.getClientTokens({
      appId: opts.appId,
      page: opts.page,
      limit: opts.limit,
    }),
    getClientTokens
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function getClientToken(
  key: ReturnType<typeof kClientTokenSWRKeys.getClientToken>
) {
  const res = await fetch(key, {
    method: "GET",
  });

  return await handleResponse<GetClientTokenEndpointResponse>(res);
}

export function useGetClientToken(opts: { clientTokenId: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    kClientTokenSWRKeys.getClientToken(opts.clientTokenId),
    getClientToken
  );

  return { data, error, isLoading, isValidating, mutate };
}

async function updateClientToken(
  key: ReturnType<typeof kClientTokenSWRKeys.updateClientToken>,
  params: {
    arg: z.infer<typeof updateClientTokenSchema>;
  }
) {
  const res = await fetch(key, {
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
    appId: string;
    clientTokenId: string;
  }
) {
  const mutationHandler = useMutationHandler(updateClientToken, {
    ...opts,
    invalidate: [
      kClientTokenSWRKeys.getClientTokens({ appId: opts.appId }),
      kClientTokenSWRKeys.getClientToken(opts.clientTokenId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kClientTokenSWRKeys.updateClientToken(opts.clientTokenId),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function deleteClientToken(
  key: ReturnType<typeof kClientTokenSWRKeys.deleteClientToken>,
  params: {
    arg: z.infer<typeof deleteClientTokenSchema>;
  }
) {
  const res = await fetch(key, {
    method: "DELETE",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse(res);
}

export type DeleteClientTokenOnSuccessParams = [
  params: Parameters<typeof deleteClientToken>,
  res: Awaited<ReturnType<typeof deleteClientToken>>
];

export function useDeleteClientToken(
  opts: IUseMutationHandlerOpts<typeof deleteClientToken> & {
    appId: string;
    clientTokenId: string;
  }
) {
  const mutationHandler = useMutationHandler(deleteClientToken, {
    ...opts,
    invalidate: [
      kClientTokenSWRKeys.getClientTokens({ appId: opts.appId }),
      kClientTokenSWRKeys.getClientToken(opts.clientTokenId),
      ...convertToArray(opts.invalidate || []),
    ],
  });

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kClientTokenSWRKeys.deleteClientToken(),
    mutationHandler
  );

  return { trigger, data, error, isMutating, reset };
}

async function encodeClientTokenJWT(
  key: ReturnType<typeof kClientTokenSWRKeys.encodeClientTokenJWT>,
  params: {
    arg: z.infer<typeof encodeClientTokenJWTSchema>;
  }
) {
  const res = await fetch(key, {
    method: "POST",
    body: JSON.stringify(params.arg),
  });

  return await handleResponse<EncodeClientTokenJWTEndpointResponse>(res);
}

export function useEncodeClientTokenJWT(opts: { clientTokenId: string }) {
  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    kClientTokenSWRKeys.encodeClientTokenJWT(opts.clientTokenId),
    encodeClientTokenJWT
  );

  return { trigger, data, error, isMutating, reset };
}
