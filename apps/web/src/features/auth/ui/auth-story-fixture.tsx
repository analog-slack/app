import { getAuthProfileQueryKey, initApiTransport } from '@packages/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { type ReactNode, useState } from 'react';

import { I18nProvider } from '@/shared/i18n';

export function AuthStoryFixture({
  children,
  signedIn = false,
  response = 'pending',
}: {
  children: ReactNode;
  signedIn?: boolean;
  response?: 'pending' | 'success' | 'error';
}) {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    if (signedIn) {
      queryClient.setQueryData(getAuthProfileQueryKey(), {
        id: 'profile',
        username: 'analog-user',
        email: 'user@example.com',
        avatarUrl: null,
      });
    }

    const mock = axios.create({
      adapter: (config) => {
        if (response === 'pending') return new Promise(() => {});
        if (response === 'error') return Promise.reject(new AxiosError('Network disconnected'));
        return Promise.resolve({ config, status: 204, statusText: '', headers: {}, data: null });
      },
    });
    initApiTransport(async (config) => (await mock.request(config)).data);
    return queryClient;
  });

  return (
    <QueryClientProvider client={client}>
      <I18nProvider initialLocale="ru">{children}</I18nProvider>
    </QueryClientProvider>
  );
}
