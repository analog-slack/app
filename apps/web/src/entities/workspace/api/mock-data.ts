import type { AuthUserDto } from '@packages/api';

import type { WorkspaceData } from '../model/types';

export function createMockData(actor: AuthUserDto): WorkspaceData {
  const users = [
    {
      id: crypto.randomUUID(),
      username: 'Mira Volkova',
      email: 'mira@example.com',
      avatarUrl: null,
    },
    {
      id: crypto.randomUUID(),
      username: 'Sam Lee',
      email: 'sam@example.com',
      avatarUrl: null,
    },
  ];
  const [mira, sam] = users;
  const workspaces = [
    {
      id: crypto.randomUUID(),
      name: 'Analog Studio',
      slug: 'analog-studio',
      ownerId: actor.id,
      createdAt: '2026-11-02T12:00:00.000Z',
    },
    {
      id: crypto.randomUUID(),
      name: 'Platform',
      slug: 'platform',
      ownerId: mira.id,
      createdAt: '2026-11-08T12:00:00.000Z',
    },
    {
      id: crypto.randomUUID(),
      name: 'Community',
      slug: 'community',
      ownerId: sam.id,
      createdAt: '2026-11-12T12:00:00.000Z',
    },
  ];
  const [studio, platform, community] = workspaces;

  return {
    users,
    workspaces,
    members: [
      {
        id: crypto.randomUUID(),
        workspaceId: studio.id,
        userId: mira.id,
        role: 'admin',
        joinedAt: studio.createdAt,
      },
      {
        id: crypto.randomUUID(),
        workspaceId: studio.id,
        userId: sam.id,
        role: 'member',
        joinedAt: studio.createdAt,
      },
      {
        id: crypto.randomUUID(),
        workspaceId: platform.id,
        userId: actor.id,
        role: 'admin',
        joinedAt: platform.createdAt,
      },
      {
        id: crypto.randomUUID(),
        workspaceId: community.id,
        userId: actor.id,
        role: 'member',
        joinedAt: community.createdAt,
      },
    ],
    projects: [
      {
        id: crypto.randomUUID(),
        workspaceId: studio.id,
        teamId: null,
        name: 'Design System',
        description: 'Analog Slack UI Kit',
        createdBy: actor.id,
        createdAt: '2026-11-04T12:00:00.000Z',
        updatedAt: null,
      },
    ],
    invitations: [],
  };
}
