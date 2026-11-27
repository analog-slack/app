import { randomUUID } from 'node:crypto';

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

async function setupMembers() {
  const [owner, admin, member, other, outsider] = await Promise.all(
    Array.from({ length: 5 }, () => http.register()),
  );
  const workspace = await http.createWorkspace(owner.cookie);
  await http.db.prisma.workspaceMember.createMany({
    data: [admin, member, other].map((user) => ({
      id: randomUUID(),
      workspaceId: workspace.id,
      userId: user.id,
      role: user.id === admin.id ? 'admin' : 'member',
    })),
  });

  const path = '/workspaces/' + workspace.id;
  const members = path + '/members';
  const remove = (actor: typeof owner, target: typeof owner) =>
    http.request(members + '/' + target.id, 'DELETE', actor.cookie);
  const role = (actor: typeof owner, target: typeof owner, role: string) =>
    http.request(members + '/' + target.id, 'PATCH', actor.cookie, { role });
  const transfer = (target: typeof owner, actor = owner) =>
    http.request(path + '/ownership/transfer', 'POST', actor.cookie, { userId: target.id });

  async function assertOwner(expectedId: string) {
    const row = await http.db.prisma.workspace.findUniqueOrThrow({ where: { id: workspace.id } });
    expect(row.ownerId).toBe(expectedId);
    expect(
      await http.db.prisma.workspaceMember.count({
        where: { workspaceId: row.id, userId: row.ownerId },
      }),
    ).toBe(1);
  }

  return {
    owner,
    admin,
    member,
    other,
    outsider,
    workspace,
    members,
    path,
    remove,
    role,
    transfer,
    assertOwner,
  };
}

it('scopes the members list and role management to the current workspace', async () => {
  const { owner, admin, member, outsider, workspace, members, role, remove, transfer } =
    await setupMembers();
  const responses = await Promise.all(
    [owner, admin, member, outsider].map((actor) => http.request(members, 'GET', actor.cookie)),
  );
  expect(responses.map(({ status }) => status)).toEqual([200, 200, 200, 404]);
  expect(await responses[2].json()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ userId: owner.id, role: 'owner' }),
      expect.objectContaining({ userId: admin.id, role: 'admin' }),
      expect.objectContaining({ userId: member.id, role: 'member' }),
    ]),
  );
  expect(
    await http.db.prisma.workspaceMember.count({
      where: { workspaceId: workspace.id, userId: outsider.id },
    }),
  ).toBe(0);

  await http.createWorkspace(outsider.cookie);
  expect((await role(owner, outsider, 'admin')).status).toBe(404);
  expect((await remove(owner, outsider)).status).toBe(404);
  expect((await role(admin, member, 'admin')).status).toBe(403);
  expect((await role(member, admin, 'member')).status).toBe(403);
  expect((await transfer(member, admin)).status).toBe(403);
  expect((await transfer(admin, member)).status).toBe(403);
  expect((await role(owner, owner, 'member')).status).toBe(409);
  expect((await role(owner, member, 'owner')).status).toBe(400);

  const promoted = await role(owner, member, 'admin');
  expect(promoted.status).toBe(200);
  expect(await promoted.json()).toMatchObject({ userId: member.id, role: 'admin' });
  const demoted = await role(owner, member, 'member');
  expect(demoted.status).toBe(200);
  expect(await demoted.json()).toMatchObject({ userId: member.id, role: 'member' });
});

it('removes only permitted memberships and preserves message authorship', async () => {
  const { owner, admin, member, other, workspace, members, path, remove } = await setupMembers();
  const message = await http.db.prisma.message.create({
    data: {
      id: randomUUID(),
      sender: { connect: { id: member.id } },
      content: 'Kept after removal',
      conversation: {
        create: { id: randomUUID(), workspace: { connect: { id: workspace.id } }, type: 'direct' },
      },
    },
  });

  expect((await remove(owner, owner)).status).toBe(409);
  expect((await remove(member, other)).status).toBe(403);
  expect((await remove(admin, admin)).status).toBe(403);
  expect((await remove(admin, member)).status).toBe(204);
  expect((await remove(owner, other)).status).toBe(204);
  expect((await remove(owner, admin)).status).toBe(204);
  expect((await http.request(path, 'GET', member.cookie)).status).toBe(404);
  expect((await http.request(members, 'GET', member.cookie)).status).toBe(404);
  expect(await http.db.prisma.message.findUnique({ where: { id: message.id } })).toMatchObject({
    senderId: member.id,
  });
});

it('transfers ownership to an administrator and makes the former owner an administrator', async () => {
  const { owner, admin, path, transfer, assertOwner } = await setupMembers();
  expect((await transfer(owner)).status).toBe(409);
  const response = await transfer(admin);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ownerId: admin.id, role: 'admin' });
  await assertOwner(admin.id);
  const detail = await http.request(path, 'GET', admin.cookie);
  expect(detail.status).toBe(200);
  expect(await detail.json()).toMatchObject({ role: 'owner' });
});

it('allows only one concurrent transfer by the same owner', async () => {
  const { admin, member, workspace, transfer, assertOwner } = await setupMembers();
  const responses = await runInWorkspaceLockOrder(http.db.prisma, workspace.id, [
    () => transfer(admin),
    () => transfer(member),
  ]);
  expect(responses.map(({ status }) => status)).toEqual([200, 403]);
  await assertOwner(admin.id);
});

it.each([true, false])(
  'serializes a transfer against removal (transfer first: %s)',
  async (transferFirst) => {
    const { owner, admin, member, workspace, remove, transfer, assertOwner } = await setupMembers();
    const operations = [() => transfer(member), () => remove(admin, member)];
    const responses = await runInWorkspaceLockOrder(
      http.db.prisma,
      workspace.id,
      transferFirst ? operations : operations.reverse(),
    );
    expect(responses.map(({ status }) => status)).toEqual(transferFirst ? [200, 409] : [204, 404]);
    await assertOwner(transferFirst ? member.id : owner.id);
  },
);
