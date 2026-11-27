import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { openWorkspaceHttp } from './testing/workspaces-http';
import { runInWorkspaceLockOrder } from './testing/workspaces-race';

jest.setTimeout(60_000);
let http: Awaited<ReturnType<typeof openWorkspaceHttp>>;
beforeAll(async () => {
  http = await openWorkspaceHttp();
});
afterAll(async () => {
  await http?.close();
});

type Invitation = {
  id: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
  status: string;
};

async function setupInvitations() {
  const [owner, admin, member, outsider, another] = await Promise.all(
    Array.from({ length: 5 }, () => http.register()),
  );
  const workspace = await http.createWorkspace(owner.cookie);
  await http.db.prisma.workspaceMember.createMany({
    data: [
      { id: randomUUID(), workspaceId: workspace.id, userId: admin.id, role: 'admin' },
      { id: randomUUID(), workspaceId: workspace.id, userId: member.id },
    ],
  });

  const path = '/workspaces/' + workspace.id;
  const list = (actor = owner) => http.request(path + '/invitations', 'GET', actor.cookie);
  const createRequest = (body: object, actor = owner) =>
    http.request(path + '/invitations', 'POST', actor.cookie, body);
  const revoke = (id: string, actor = owner) =>
    http.request(path + '/invitations/' + id, 'DELETE', actor.cookie);
  const accept = (token: string, actor = outsider) =>
    http.request('/workspaces/invitations/accept', 'POST', actor.cookie, { token });

  async function create(body: object = {}, actor = owner): Promise<Invitation> {
    const response = await createRequest(body, actor);
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return response.json();
  }

  function membershipCount(userId = outsider.id) {
    return http.db.prisma.workspaceMember.count({ where: { workspaceId: workspace.id, userId } });
  }

  return {
    owner,
    admin,
    member,
    outsider,
    another,
    workspace,
    path,
    list,
    createRequest,
    create,
    revoke,
    accept,
    membershipCount,
  };
}

it('allows only the owner and admins to administer invitations within their workspace', async () => {
  const { owner, admin, member, outsider, workspace, list, create, createRequest, revoke } =
    await setupInvitations();
  const invite = await create({}, admin);
  expect((await list(admin)).status).toBe(200);
  for (const [actor, status] of [
    [member, 403],
    [outsider, 404],
  ] as const) {
    expect((await createRequest({}, actor)).status).toBe(status);
    expect((await list(actor)).status).toBe(status);
    expect((await revoke(invite.id, actor)).status).toBe(status);
  }

  const foreignWorkspace = await http.createWorkspace(outsider.cookie);
  const foreignInvite = await http.db.prisma.workspaceInviteLink.create({
    data: {
      id: randomUUID(),
      invitedBy: outsider.id,
      workspaceId: foreignWorkspace.id,
      tokenHash: randomBytes(32).toString('hex'),
      createdAt: new Date(),
    },
  });
  expect((await revoke(foreignInvite.id, owner)).status).toBe(404);
  expect(
    await http.db.prisma.workspaceInviteLink.findUniqueOrThrow({ where: { id: foreignInvite.id } }),
  ).toMatchObject({ revokedAt: null });

  expect((await revoke(invite.id, owner)).status).toBe(204);
  expect((await revoke(invite.id, admin)).status).toBe(204);
  expect(
    await http.db.prisma.workspaceInviteLink.findMany({ where: { workspaceId: workspace.id } }),
  ).toMatchObject([{ revokedAt: expect.any(Date) }]);
});

it('exposes the token only on creation and accepts supported expiration values', async () => {
  const { list, create, createRequest } = await setupInvitations();
  const unlimited = await create();
  expect(unlimited).toMatchObject({ expiresAt: null, status: 'active' });
  expect(unlimited.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const stored = await http.db.prisma.workspaceInviteLink.findUniqueOrThrow({
    where: { id: unlimited.id },
  });
  expect(stored.tokenHash).toBe(createHash('sha256').update(unlimited.token).digest('hex'));
  const tokens = new Set([unlimited.token]);
  for (const days of [7, 30, 12, 365]) {
    const link = await create({ expiresInDays: days });
    expect(Date.parse(link.expiresAt ?? '') - Date.parse(link.createdAt)).toBe(days * 86_400_000);
    tokens.add(link.token);
  }
  expect(tokens.size).toBe(5);
  for (const invalid of [0, -1, 1.5, 366, null, '7']) {
    expect((await createRequest({ expiresInDays: invalid })).status).toBe(400);
  }

  const response = await list();
  expect(response.status).toBe(200);
  const entries: Record<string, unknown>[] = await response.json();
  expect(entries).toHaveLength(5);
  for (const entry of entries) {
    expect(entry).not.toHaveProperty('token');
    expect(entry).not.toHaveProperty('tokenHash');
    expect(entry.status).toBe('active');
  }
});

it('reuses active links and opens known inactive links for existing members', async () => {
  const { workspace, another, member, list, create, revoke, accept } = await setupInvitations();
  const reused = await create();
  const expiring = await create({ expiresInDays: 7 });
  const independent = await create();
  expect((await accept(randomBytes(32).toString('base64url'))).status).toBe(404);
  for (const actor of [undefined, another]) {
    const response = await accept(reused.token, actor);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ id: workspace.id, role: 'member' });
  }

  await http.db.prisma.workspaceInviteLink.update({
    where: { id: expiring.id },
    data: { expiresAt: new Date() },
  });
  expect((await revoke(reused.id)).status).toBe(204);
  expect((await accept(reused.token)).status).toBe(200);
  for (const link of [reused, expiring]) {
    const response = await accept(link.token, member);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: workspace.id, role: 'member' });
  }

  const nonMember = await http.register();
  expect((await accept(reused.token, nonMember)).status).toBe(410);
  expect((await accept(expiring.token, nonMember)).status).toBe(410);
  const entries: { id: string; status: string }[] = await (await list()).json();
  expect(Object.fromEntries(entries.map(({ id, status }) => [id, status]))).toEqual({
    [reused.id]: 'revoked',
    [expiring.id]: 'expired',
    [independent.id]: 'active',
  });
});

it('allows a removed admin to return only with member permissions', async () => {
  const { owner, admin, path, create, revoke, accept, createRequest, membershipCount } =
    await setupInvitations();
  const old = await create();
  const active = await create();
  expect((await http.request(path + '/members/' + admin.id, 'DELETE', owner.cookie)).status).toBe(
    204,
  );
  expect((await http.request(path, 'GET', admin.cookie)).status).toBe(404);
  expect((await revoke(old.id)).status).toBe(204);
  expect((await accept(old.token, admin)).status).toBe(410);
  const rejoined = await accept(active.token, admin);
  expect(rejoined.status).toBe(200);
  expect(await rejoined.json()).toMatchObject({ role: 'member' });
  expect(await membershipCount(admin.id)).toBe(1);
  expect((await createRequest({}, admin)).status).toBe(403);
});

it('persists one membership for concurrent accepts by the same user', async () => {
  const { workspace, create, accept, membershipCount } = await setupInvitations();
  const invite = await create();
  const responses = await runInWorkspaceLockOrder(http.db.prisma, workspace.id, [
    () => accept(invite.token),
    () => accept(invite.token),
  ]);
  expect(responses.map(({ status }) => status)).toEqual([200, 200]);
  expect(await membershipCount()).toBe(1);
});

it.each([true, false])(
  'serializes acceptance and revocation (accept first: %s)',
  async (acceptFirst) => {
    const { workspace, another, create, accept, revoke, membershipCount } =
      await setupInvitations();
    const invite = await create();
    const operations = [() => accept(invite.token), () => revoke(invite.id)];
    const responses = await runInWorkspaceLockOrder(
      http.db.prisma,
      workspace.id,
      acceptFirst ? operations : operations.reverse(),
    );
    expect(responses.map(({ status }) => status)).toEqual(acceptFirst ? [200, 204] : [204, 410]);
    expect(await membershipCount()).toBe(Number(acceptFirst));
    expect((await accept(invite.token, another)).status).toBe(410);
  },
);

it('checks expiration after waiting for the workspace lock', async () => {
  const { workspace, create, accept, membershipCount } = await setupInvitations();
  const invite = await create({ expiresInDays: 7 });
  const [response] = await runInWorkspaceLockOrder(
    http.db.prisma,
    workspace.id,
    [() => accept(invite.token)],
    (tx) =>
      tx.workspaceInviteLink.update({ where: { id: invite.id }, data: { expiresAt: new Date() } }),
  );
  expect(response.status).toBe(410);
  expect(await membershipCount()).toBe(0);
});
