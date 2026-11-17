import type { AxiosError, AxiosRequestConfig } from 'axios';

export type HttpTransport = <T>(config: AxiosRequestConfig) => Promise<T>;
export type ErrorType<T> = AxiosError<T>;
export type BodyType<T> = T;

let transport: HttpTransport | undefined;

export function initApiTransport(adapter: HttpTransport) {
  transport = adapter;
}

export function apiTransport<T>(config: AxiosRequestConfig): Promise<T> {
  if (!transport) throw new Error('API transport is not initialized');
  return transport<T>(config);
}
