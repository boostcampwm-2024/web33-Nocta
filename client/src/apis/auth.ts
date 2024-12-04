import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useUserActions } from "@stores/useUserStore";
import { unAuthorizationFetch, fetch } from "./axios";

const authKey = {
  all: ["auth"] as const,
  refresh: () => [...authKey.all, "refresh"] as const,
};
export interface ApiErrorResponse {
  message: string;
  code?: string;
}

interface MutationOptions {
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}
export const useSignupMutation = (onSuccess: () => void, options?: MutationOptions) => {
  const fetcher = ({ name, email, password }: { name: string; email: string; password: string }) =>
    unAuthorizationFetch.post("/auth/register", { name, email, password });

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      onSuccess();
    },
    onError: options?.onError,
  });
};
export const useLoginMutation = (onSuccess: () => void, options?: MutationOptions) => {
  const { setUserInfo } = useUserActions();

  const fetcher = ({ email, password }: { email: string; password: string }) =>
    unAuthorizationFetch.post("/auth/login", { email, password });

  return useMutation({
    mutationFn: fetcher,
    onSuccess: (response) => {
      const { id, name } = response.data;
      const [, accessToken] = response.headers.authorization.split(" ");
      setUserInfo(id, name, accessToken);
      onSuccess();
    },
    onError: options?.onError,
  });
};

export const useLogoutMutation = (onSuccess: () => void) => {
  const { removeUserInfo } = useUserActions();

  const fetcher = () => fetch.post("/auth/logout");

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      removeUserInfo();
      onSuccess();
    },
  });
};

export const useRefreshQuery = () => {
  const { updateAccessToken } = useUserActions();

  const fetcher = () => fetch.get("/auth/refresh");

  return useQuery({
    queryKey: authKey.refresh(),
    queryFn: async () => {
      const response = await fetcher();

      const [, accessToken] = response.headers.authorization.split(" ");
      updateAccessToken(accessToken);

      return response.data;
    },
    enabled: false,
  });
};
