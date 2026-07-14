export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
  provider: string;
  emailVerified: string | null;
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    workspaceLimit: number | null;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
