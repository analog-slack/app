// Generated from the NestJS OpenAPI document. See packages/api/orval.config.mjs.
import { useMutation, useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';

import { apiTransport, type ErrorType } from '../transport';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export interface AuthResponseDto {
  user: AuthUserDto;
}

export interface AuthErrorDto {
  statusCode: number;
  message?: string | string[];
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
}

export function authLogin(data: LoginDto) {
  return apiTransport<AuthResponseDto>({
    url: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export function useAuthLogin() {
  return useMutation<AuthResponseDto, ErrorType<AuthErrorDto>, { data: LoginDto }>({
    mutationKey: ['authLogin'],
    mutationFn: ({ data }) => authLogin(data),
  });
}

export function authRegister(data: RegisterDto) {
  return apiTransport<AuthResponseDto>({
    url: '/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export function useAuthRegister() {
  return useMutation<AuthResponseDto, ErrorType<AuthErrorDto>, { data: RegisterDto }>({
    mutationKey: ['authRegister'],
    mutationFn: ({ data }) => authRegister(data),
  });
}

export function authRefresh() {
  return apiTransport<AuthResponseDto>({
    url: '/auth/refresh',
    method: 'POST',
  });
}

export function useAuthRefresh() {
  return useMutation<AuthResponseDto, ErrorType<AuthErrorDto>, void>({
    mutationKey: ['authRefresh'],
    mutationFn: authRefresh,
  });
}

export function authLogout() {
  return apiTransport<void>({
    url: '/auth/logout',
    method: 'POST',
  });
}

export function useAuthLogout() {
  return useMutation<void, ErrorType<void>, void>({
    mutationKey: ['authLogout'],
    mutationFn: authLogout,
  });
}

export const getAuthProfileQueryKey = () => ['/auth/me'] as const;

export function authProfile(signal?: AbortSignal) {
  return apiTransport<AuthUserDto>({
    url: '/auth/me',
    method: 'GET',
    signal,
  });
}

export function useAuthProfile(options?: {
  query?: Partial<UseQueryOptions<AuthUserDto, ErrorType<AuthErrorDto>>>;
}) {
  return useQuery({
    queryKey: getAuthProfileQueryKey(),
    queryFn: ({ signal }) => authProfile(signal),
    ...options?.query,
  });
}
