import { randomUUID } from 'node:crypto';

import { openWorkspaceHttp } from './testing/workspaces-http';

jest.setTimeout(60_000);

let http: Awaited<ReturnType<typeof openWorkspaceHttp>>;

beforeAll(async () => {
  http = await openWorkspaceHttp();
});
afterAll(async () => {
  await http?.close();
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
