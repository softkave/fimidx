import { IGetUserEndpointResponse } from "fmdx-core/definitions/user";
import useSWR from "swr";
import { useAppSession } from "../clientHooks/userHooks.ts";
import { handleResponse } from "./utils.ts";

export const kApiUserSWRKeys = {
  getUserKey: `/api/user`,
};

async function getUser(url: string) {
  const response = await fetch(url, {
    method: "POST",
  });

  return await handleResponse<IGetUserEndpointResponse>(response);
}

export function useGetUser() {
  const { userId } = useAppSession();
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    userId ? kApiUserSWRKeys.getUserKey : null,
    getUser
  );

  return { data, error, isLoading, mutate, isValidating };
}
