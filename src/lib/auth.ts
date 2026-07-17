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

export async function verifyEmailRequest(token: string): Promise<AuthUser> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ user: AuthUser; message: string }>>(
    '/auth/verify-email',
    { token },
  );
  return data.data.user;
}

export async function resendVerificationRequest(): Promise<void> {
  await apiClient.post('/auth/resend-verification');
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPasswordRequest(payload: {
  token: string;
  password: string;
}): Promise<void> {
  await apiClient.post('/auth/reset-password', payload);
}

export async function updateProfileRequest(payload: {
  fullName: string;
  /** `File` to upload, `null` to clear, omit to leave unchanged */
  avatar?: File | null;
}): Promise<AuthUser> {
  const formData = new FormData();
  formData.append('fullName', payload.fullName);
  if (payload.avatar instanceof File) {
    formData.append('avatar', payload.avatar);
  } else if (payload.avatar === null) {
    formData.append('avatar', '');
  }

  const { data } = await apiClient.patch<ApiSuccessResponse<{ user: AuthUser }>>(
    '/auth/profile',
    formData,
    {
      transformRequest: [
        (body, headers) => {
          if (body instanceof FormData) {
            delete headers['Content-Type'];
          }
          return body;
        },
      ],
    },
  );
  return data.data.user;
}
