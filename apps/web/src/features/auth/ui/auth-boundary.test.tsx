import { getAuthProfileQueryKey, initApiTransport } from '@packages/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/shared/i18n';

import { AuthBoundary } from './auth-boundary';

afterEach(cleanup);

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/profile',
  useRouter: () => router,
}));

function renderBoundary() {
  router.replace.mockClear();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <I18nProvider initialLocale="ru">
        <AuthBoundary mode="protected">
          <h1>Приватный профиль</h1>
        </AuthBoundary>
      </I18nProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('AuthBoundary', () => {
  it('holds protected content behind a loading state until the session is verified', async () => {
    initApiTransport(() => new Promise(() => {}));
    const client = renderBoundary();
    expect(screen.getByRole('status')).toHaveTextContent('Проверяем сессию');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    client.setQueryData(getAuthProfileQueryKey(), {
      id: 'id',
      email: 'test@example.com',
      username: 'Tester',
      avatarUrl: null,
    });
    expect(await screen.findByRole('heading', { name: 'Приватный профиль' })).toBeInTheDocument();
  });

  it('keeps the destination when the session is unauthorized', async () => {
    const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };
    initApiTransport(() =>
      Promise.reject(
        new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
          config,
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          data: null,
        }),
      ),
    );
    renderBoundary();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login?returnTo=%2Fprofile'));
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('lets the user retry a network error', async () => {
    const request = vi.fn((): never => {
      throw new Error('Network disconnected');
    });
    initApiTransport(request);
    renderBoundary();
    const retry = await screen.findByRole('button', { name: 'Повторить' });
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось выполнить запрос');
    await userEvent.click(retry);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });
});
