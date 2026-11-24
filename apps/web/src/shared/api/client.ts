import { authRefresh, initApiTransport, type HttpTransport } from '@packages/api';
import axios, {
  CanceledError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

const sessionChanges = new Set(['/auth/login', '/auth/register', '/auth/logout']);
const refreshPath = '/auth/refresh';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true,
  allowAbsoluteUrls: false,
  timeout: 15_000,
});

interface SessionRequestConfig extends InternalAxiosRequestConfig {
  sessionVersion?: number;
  refreshVersion?: number;
  retried?: boolean;
}

let sessionVersion = 0;
let refreshVersion = 0;
let refreshPromise: Promise<void> | undefined;
let sessionChange: Promise<unknown> | undefined;

export function getApiErrorStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

function refreshAccessCookie() {
  refreshPromise ??= authRefresh()
    .then(() => {
      refreshVersion++;
    })
    .finally(() => {
      refreshPromise = undefined;
    });
  return refreshPromise;
}

apiClient.interceptors.request.use(async (config: SessionRequestConfig) => {
  if (config.url?.startsWith('/auth/')) config.baseURL = '/api';
  if (sessionChanges.has(config.url ?? '') || config.url === refreshPath) return config;
  await sessionChange?.catch(() => undefined);
  if (config.sessionVersion !== undefined && config.sessionVersion !== sessionVersion) {
    throw new CanceledError('Session changed');
  }
  config.sessionVersion = sessionVersion;
  config.refreshVersion = refreshVersion;
  return config;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  const config: SessionRequestConfig | undefined = error.config;
  if (
    !config ||
    config.retried ||
    sessionChanges.has(config.url ?? '') ||
    config.url === refreshPath ||
    config.sessionVersion !== sessionVersion ||
    config.signal?.aborted
  ) {
    throw error;
  }

  config.retried = true;
  if (config.refreshVersion === refreshVersion) await refreshAccessCookie();
  return apiClient.request(config);
});

const transport: HttpTransport = async <T>(config: AxiosRequestConfig) => {
  if (!sessionChanges.has(config.url ?? '')) return (await apiClient.request<T>(config)).data;

  sessionVersion++;
  // Apply a session change after any earlier response that can write cookies.
  const pending = Promise.allSettled([sessionChange, refreshPromise]).then(() =>
    apiClient.request<T>(config),
  );
  sessionChange = pending;
  try {
    return (await pending).data;
  } finally {
    if (sessionChange === pending) sessionChange = undefined;
  }
};

export function configureApiTransport() {
  initApiTransport(transport);
}
