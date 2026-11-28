import type { AuthUserDto } from '@packages/api';
import { queryOptions } from '@tanstack/react-query';

import { getWorkspace, listMembers, listProjects, listWorkspaces } from '@/entities/workspace';

export const workspaceKeys = {
  all: (userId: string) => ['mock-workspaces', userId] as const,
  list: (userId: string) => [...workspaceKeys.all(userId), 'list'] as const,
  detail: (userId: string, id: string) => [...workspaceKeys.all(userId), 'detail', id] as const,
};

export function workspacesQuery(actor: AuthUserDto) {
  return queryOptions({
    queryKey: workspaceKeys.list(actor.id),
    queryFn: () => listWorkspaces(actor),
    retry: false,
  });
}

export function workspaceQuery(actor: AuthUserDto, id: string) {
  return queryOptions({
    queryKey: workspaceKeys.detail(actor.id, id),
    queryFn: async () => {
      const workspace = await getWorkspace(actor, id);
      if (!workspace) return null;
      const [{ members, invitations }, projects] = await Promise.all([
        listMembers(actor, id),
        listProjects(actor, id),
      ]);
      return { workspace, members, invitations, projects };
    },
    retry: false,
  });
}
