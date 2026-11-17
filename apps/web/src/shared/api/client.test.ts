import { authLogout, authProfile } from '@packages/api';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient, configureApiTransport } from './client';

configureApiTransport();
const defaultAdapter = apiClient.defaults.adapter;
const profile = { id: '1', email: 'a@example.com', username: 'test', avatarUrl: null };

function response(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse<unknown> {
  return { config, data, status, statusText: '', headers: {} };
}

afterEach(() => {
  apiClient.defaults.adapter = defaultAdapter;
});

describe('API authentication', () => {
  it('shares one cookie refresh and retries concurrent 401s without an Authorization header', async () => {
    let browserHasAccessCookie = false;
    const refresh = vi.fn(async (config: InternalAxiosRequestConfig) => {
      browserHasAccessCookie = true;
      return response(config, 200, { user: profile });
    });
    apiClient.defaults.adapter = async (config) => {
      expect(config.baseURL).toBe('/api');
      if (config.url === '/auth/refresh') return refresh(config);
      expect(config.headers.has('Authorization')).toBe(false);
      expect(config.withCredentials).toBe(true);
      if (browserHasAccessCookie) return response(config, 200, profile);
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response(config, 401, null),
      );
    };

    await expect(Promise.all([authProfile(), authProfile()])).resolves.toEqual([profile, profile]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('waits for an in-flight cookie refresh before sending logout', async () => {
    const refreshStarted = Promise.withResolvers<void>();
    const refreshFinished = Promise.withResolvers<void>();
    const requests: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/auth/refresh') {
        refreshStarted.resolve();
        await refreshFinished.promise;
        requests.push('refresh');
        return response(config, 200, { user: profile });
      }
      if (config.url === '/auth/logout') {
        requests.push('logout');
        return response(config, 204, null);
      }
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response(config, 401, null),
      );
    };

    const pendingProfile = authProfile().catch((error: unknown) => error);
    await refreshStarted.promise;
    const pendingLogout = authLogout();
    refreshFinished.resolve();
    await pendingLogout;

    expect(requests).toEqual(['refresh', 'logout']);
    expect(await pendingProfile).toMatchObject({ code: 'ERR_CANCELED' });
  });
});
