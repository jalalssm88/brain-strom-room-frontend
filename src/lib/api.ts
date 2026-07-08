import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return new ApiError(
      data?.error?.message ?? error.message ?? 'Request failed',
      error.response?.status ?? 0,
      data?.error?.code ?? 'UNKNOWN_ERROR',
      data?.error?.details,
    );
  }
  return new ApiError('Unexpected error', 0, 'UNKNOWN_ERROR');
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every request — the same mechanism a mobile
// client would use (no cookies involved).
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

// On a 401, attempt a single refresh and retry the original request.
// Concurrent 401s wait on the same in-flight refresh instead of each
// triggering their own.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data.data.tokens;
      setTokens(accessToken, newRefreshToken);

      pendingRequests.forEach((resolveRequest) => resolveRequest(accessToken));
      pendingRequests = [];

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      pendingRequests = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
