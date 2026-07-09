'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  signupRequest,
  loginRequest,
  logoutRequest,
  getMeRequest,
  verifyEmailRequest,
  resendVerificationRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
} from '@/lib/auth';
import { setTokens, clearTokens, getRefreshToken } from '@/lib/tokenStorage';
import { useAppDispatch } from '@/store/hooks';
import { setUser, clearUser } from '@/store/authSlice';

export function useSignup() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: signupRequest,
    onSuccess: ({ user, tokens }) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      dispatch(setUser(user));
    },
  });
}

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ user, tokens }) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      dispatch(setUser(user));
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutRequest(getRefreshToken()),
    onSettled: () => {
      clearTokens();
      dispatch(clearUser());
      queryClient.clear();
    },
  });
}

export function useMe() {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await getMeRequest();
      dispatch(setUser(user));
      return user;
    },
    retry: false,
  });
}

export function useVerifyEmail() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmailRequest,
    onSuccess: (user) => {
      dispatch(setUser(user));
      queryClient.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: resendVerificationRequest,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPasswordRequest,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPasswordRequest,
  });
}
