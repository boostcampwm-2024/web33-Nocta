import axios, { AxiosError, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";
import { useErrorStore } from "@stores/useErrorStore";
import { useUserStore } from "@stores/useUserStore";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const baseConfig: CreateAxiosDefaults = {
  baseURL: `${import.meta.env.VITE_API_URL}`,
  withCredentials: true,
};

interface ApiError {
  message: string;
  code?: string;
}

const getErrorMessage = (error: AxiosError<ApiError>) => {
  return error.response?.data?.message || error.message || "알 수 없는 오류가 발생했습니다.";
};

const handleGlobalError = (error: AxiosError<ApiError>) => {
  const errorStore = useErrorStore.getState();
  const errorMessage = getErrorMessage(error);

  if (!error.response) {
    errorStore.setErrorModal(true, "네트워크 연결을 확인해주세요.");
    return;
  }

  // 에러 상태 코드에 따른 처리
  switch (error.response.status) {
    case 401:
      // 이미 access token. refresh token이 만료된 경우 여기로 넘어옴.
      useUserStore.getState().actions.removeUserInfo();
      errorStore.setErrorModal(true, "유효하지 않은 사용자입니다. 다시 로그인해주세요.");
      break;

    case 500:
    case 502:
    case 503:
      errorStore.setErrorModal(true, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      break;
    default:
      errorStore.setErrorModal(true, errorMessage);
  }
};

export const unAuthorizationFetch = axios.create(baseConfig);

export const fetch = axios.create(baseConfig);

fetch.interceptors.request.use(
  function (config) {
    const { accessToken } = useUserStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  function (error) {
    handleGlobalError(error);
    return Promise.reject(error);
  },
);

fetch.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error: AxiosError) {
    const originalRequest: CustomAxiosRequestConfig | undefined = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // access token이 만료된 경우 refresh token으로 새로운 access token을 발급받음
        // 이때 refresh token만 있기에 unAuthorizationFetch를 사용.
        // 만약 fetch를 사용하면 401 에러가 무한으로 발생함.
        const response = await unAuthorizationFetch.get("/auth/refresh");

        const [, accessToken] = response.headers.authorization.split(" ");

        useUserStore.setState({ accessToken });
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return fetch(originalRequest);
      } catch (refreshError) {
        handleGlobalError(refreshError as AxiosError<ApiError>);
        return Promise.reject(refreshError);
      }
    }

    handleGlobalError(error as AxiosError<ApiError>);
    return Promise.reject(error);
  },
);
``;
