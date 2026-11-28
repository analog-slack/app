import { randomUUID } from 'node:crypto';

import { AUTH_ACCESS_COOKIE } from '@app/shared';

import { createOpenApiDocument } from '../openapi';
import { openWorkspaceHttp } from './testing/workspaces-http';

jest.setTimeout(60_000);

let http: Awaited<ReturnType<typeof openWorkspaceHttp>>;

beforeAll(async () => {
  http = await openWorkspaceHttp();
});
afterAll(async () => {
  await http?.close();
});

it('exports the complete workspaces cookie API for client generation', () => {
  const document = createOpenApiDocument(http.app);
  const operations = [
    ['/workspaces', 'post', 'WorkspacesCreate', ['201', '400', '401', '403', '409']],
    ['/workspaces', 'get', 'WorkspacesList', ['200', '401']],
    ['/workspaces/{workspaceId}', 'get', 'WorkspacesGet', ['200', '400', '401', '404']],
    [
      '/workspaces/{workspaceId}/members',
      'get',
      'WorkspacesListMembers',
      ['200', '400', '401', '404'],
    ],
    [
      '/workspaces/{workspaceId}/members/{userId}',
      'patch',
      'WorkspacesUpdateMemberRole',
      ['200', '400', '401', '403', '404', '409'],
    ],
    [
      '/workspaces/{workspaceId}/members/{userId}',
      'delete',
      'WorkspacesRemoveMember',
      ['204', '400', '401', '403', '404', '409'],
    ],
    [
      '/workspaces/{workspaceId}/ownership/transfer',
      'post',
      'WorkspacesTransferOwnership',
      ['200', '400', '401', '403', '404', '409'],
    ],
    [
      '/workspaces/{workspaceId}/invitations',
      'post',
      'WorkspacesCreateInvitation',
      ['201', '400', '401', '403', '404'],
    ],
    [
      '/workspaces/{workspaceId}/invitations',
      'get',
      'WorkspacesListInvitations',
      ['200', '400', '401', '403', '404'],
    ],
    [
      '/workspaces/{workspaceId}/invitations/{invitationId}',
      'delete',
      'WorkspacesRevokeInvitation',
      ['204', '400', '401', '403', '404'],
    ],
    [
      '/workspaces/invitations/accept',
      'post',
      'WorkspacesAcceptInvitation',
      ['200', '400', '401', '403', '404', '410'],
    ],
  ] as const;
  for (const [path, method, operationId, statuses] of operations) {
    const operation = document.paths[path]?.[method];
    expect(operation).toMatchObject({
      operationId,
      tags: ['workspaces'],
      security: [{ [AUTH_ACCESS_COOKIE]: [] }],
    });
    expect(Object.keys(operation?.responses ?? {}).sort()).toEqual([...statuses].sort());
  }

  const accept = document.paths['/workspaces/invitations/accept']?.post;
  expect(accept?.requestBody).toMatchObject({
    required: true,
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/AcceptWorkspaceInvitationDto' } },
    },
  });
  expect(accept?.responses['410']).toBeDefined();
  const preview = document.paths['/workspaces/invitations/preview']?.post;
  expect(preview).toMatchObject({
    operationId: 'WorkspacesPreviewInvitation',
    security: [{}, { [AUTH_ACCESS_COOKIE]: [] }],
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/WorkspaceInvitationPreviewDto',
            },
          },
        },
      },
    },
  });
  const schemas = document.components?.schemas;
  expect(schemas?.WorkspaceInvitationPreviewDto).toHaveProperty('properties.status.enum', [
    'alreadyMember',
    'active',
    'expired',
    'revoked',
  ]);
  expect(schemas?.CreateWorkspaceInvitationDto).toMatchObject({
    properties: { expiresInDays: { type: 'integer', minimum: 1, maximum: 365 } },
  });
  expect(schemas?.CreatedWorkspaceInvitationDto).toHaveProperty('properties.token');
  expect(schemas?.AcceptWorkspaceInvitationDto).toHaveProperty('properties.token');
  expect(schemas?.WorkspaceInvitationDto).toHaveProperty('properties.status.enum', [
    'active',
    'expired',
    'revoked',
  ]);
  expect(schemas?.WorkspaceInvitationDto).not.toHaveProperty('properties.tokenHash');
  expect(schemas?.WorkspaceInvitationDto).not.toHaveProperty('properties.token');
  expect(schemas?.WorkspaceDto).toHaveProperty('properties.role.enum', [
    'owner',
    'admin',
    'member',
  ]);
  expect(schemas?.UpdateWorkspaceMemberRoleDto).toHaveProperty('properties.role.enum', [
    'admin',
    'member',
  ]);
});

it('creates owner membership and lists every workspace for the caller', async () => {
  const owner = await http.register();
  const empty = await http.request('/workspaces', 'GET', owner.cookie);
  expect(empty.status).toBe(200);
  expect(await empty.json()).toEqual([]);

  const beta = await http.createWorkspace(owner.cookie, 'beta');
  await http.createWorkspace(owner.cookie, 'alpha');
  expect(beta).toMatchObject({ name: 'Example', role: 'owner', ownerId: owner.id });
  expect(
    await http.db.prisma.workspaceMember.count({
      where: { workspaceId: beta.id, userId: owner.id },
    }),
  ).toBe(1);

  const list = await http.request('/workspaces', 'GET', owner.cookie);
  expect(list.status).toBe(200);
  const spaces: { slug: string }[] = await list.json();
  expect(spaces.map(({ slug }) => slug)).toEqual(['alpha', 'beta']);
  const detail = await http.request('/workspaces/' + beta.id, 'GET', owner.cookie);
  expect(detail.status).toBe(200);
  expect(await detail.json()).toEqual(beta);
});

it('rejects invalid or duplicate slugs without creating a second workspace', async () => {
  const owner = await http.register();
  const slug = randomUUID();
  await http.createWorkspace(owner.cookie, slug);
  const invalid = await http.request('/workspaces', 'POST', owner.cookie, {
    name: 'Example',
    slug: 'Invalid slug',
  });
  const duplicate = await http.request('/workspaces', 'POST', owner.cookie, {
    name: 'Example',
    slug,
  });
  expect(invalid.status).toBe(400);
  expect(duplicate.status).toBe(409);
  expect(await http.db.prisma.workspaceMember.count({ where: { userId: owner.id } })).toBe(1);
});

it('checks workspace names against text PostgreSQL can store', async () => {
  const owner = await http.register();
  const create = (name: string) =>
    http.request('/workspaces', 'POST', owner.cookie, { name, slug: randomUUID() });

  const valid = 'x'.repeat(148) + '❤️';
  const accepted = await create(valid);
  expect(accepted.status).toBe(201);
  expect(await accepted.json()).toMatchObject({ name: valid });

  expect((await create('x'.repeat(149) + '❤️')).status).toBe(400);
  expect((await create('Example\0name')).status).toBe(400);
  expect((await create('Example\uD800name')).status).toBe(400);
  expect(await http.db.prisma.workspaceMember.count({ where: { userId: owner.id } })).toBe(1);
});

it('checks current sessions, workspace membership and cross-origin mutations', async () => {
  const owner = await http.register();
  const outsider = await http.register();
  const workspace = await http.createWorkspace(owner.cookie);
  expect((await http.request('/workspaces/' + workspace.id, 'GET', outsider.cookie)).status).toBe(
    404,
  );
  expect((await http.request('/workspaces')).status).toBe(401);
  expect(
    (
      await http.request(
        '/workspaces',
        'POST',
        owner.cookie,
        { name: 'Example', slug: 'foreign' },
        'https://example.test',
      )
    ).status,
  ).toBe(403);

  expect((await http.request('/auth/logout', 'POST', owner.cookie)).status).toBe(204);
  expect((await http.request('/workspaces', 'GET', owner.cookie)).status).toBe(401);
});
