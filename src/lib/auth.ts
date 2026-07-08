import { apiClient } from './api';
import { ApiSuccessResponse, AuthResponse, AuthUser } from '@/types/auth';

export async function signupRequest(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/signup', payload);
  return data.data;
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/login', payload);
  return data.data;
}

export async function logoutRequest(refreshToken: string | null): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMeRequest(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ user: AuthUser }>>('/auth/me');
  return data.data.user;
}
