import { getAuthProfileQueryKey, initApiTransport } from '@packages/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/shared/i18n';

import { LoginForm } from './login-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({}) }));

afterEach(cleanup);

describe('LoginForm', () => {
  it('submits the form to the login API and updates the current session', async () => {
    const profile = { id: 'id', email: 'test@example.com', username: 'Tester', avatarUrl: null };
    const client = new QueryClient();
    const transport = axios.create({
      adapter: async (config) => {
        expect(config.url).toBe('/auth/login');
        expect(JSON.parse(config.data)).toEqual({
          email: profile.email,
          password: 'test-password',
        });
        return {
          config,
          data: { user: profile },
          status: 200,
          statusText: '',
          headers: {},
        };
      },
    });
    initApiTransport(async (config) => (await transport.request(config)).data);
    render(
      <QueryClientProvider client={client}>
        <I18nProvider initialLocale="ru">
          <LoginForm returnTo="/profile?tab=details" />
        </I18nProvider>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Почта'), profile.email);
    await user.type(screen.getByLabelText('Пароль'), 'test-password');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    await waitFor(() => expect(client.getQueryData(getAuthProfileQueryKey())).toEqual(profile));
  });
});
