import { getAuthProfileQueryKey } from '@packages/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { listWorkspaces, type WorkspaceSummary } from '@/entities/workspace';
import { I18nProvider } from '@/shared/i18n';

import { workspaceKeys } from '../model/queries';

export function WorkspaceStoryFixture({
  children,
  mode = 'default',
  access,
}: {
  children: (id: string) => ReactNode;
  mode?: 'default' | 'loading' | 'error' | 'empty';
  access?: WorkspaceSummary['access'];
}) {
  const [{ actor, client }] = useState(() => {
    const actor = {
      id: crypto.randomUUID(),
      username: 'Taylor Smith',
      email: 'taylor@example.com',
      avatarUrl: null,
    };
    const client = new QueryClient();
    client.setQueryData(getAuthProfileQueryKey(), actor);
    if (mode === 'loading' || mode === 'error') {
      client.setQueryDefaults(workspaceKeys.all(actor.id), {
        persister: () =>
          mode === 'loading' ? new Promise(() => {}) : Promise.reject(new Error('Unavailable')),
      });
    }
    if (mode === 'empty') {
      client.setQueryDefaults(workspaceKeys.all(actor.id), { staleTime: Infinity });
      client.setQueryData(workspaceKeys.list(actor.id), []);
    }
    return { actor, client };
  });
  const [id, setId] = useState(access && mode === 'default' ? null : actor.id);

  useEffect(() => {
    if (!access || mode !== 'default') return;
    void listWorkspaces(actor).then((items) => {
      setId(items.find((workspace) => workspace.access === access)?.id ?? null);
    });
  }, [access, actor, mode]);

  return (
    <QueryClientProvider client={client}>
      <I18nProvider initialLocale="ru">{id && children(id)}</I18nProvider>
    </QueryClientProvider>
  );
}
