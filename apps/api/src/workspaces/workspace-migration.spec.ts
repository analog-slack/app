import { randomUUID } from 'node:crypto';

import { deployWorkspaceTestDb, openWorkspaceTestDb } from './testing/workspaces-db';

jest.setTimeout(60_000);

it('deploys the invite link migration to a new schema', async () => {
  const db = await openWorkspaceTestDb();
  try {
    const [{ count }] = await db.prisma.$queryRaw<[{ count: bigint }]>
      `SELECT count(*) FROM workspace_invite_links`;
    expect(count).toBe(0n);
  } finally {
    await db.close();
  }
});

it('backfills owner membership, normalizes roles and preserves email invitations', async () => {
  const db = await openWorkspaceTestDb({ deploy: false });
  try {
    deployWorkspaceTestDb(db.url, '20261116140000_add_auth_sessions');
    const [ownerId, adminId, nullRoleId, legacyOwnerId, workspaceId, invitationId] =
      Array.from({ length: 6 }, () => randomUUID());
    for (const id of [ownerId, adminId, nullRoleId, legacyOwnerId]) {
      await db.prisma.$executeRaw`
        INSERT INTO users (id, email, username, password_hash)
        VALUES (${id}::uuid, ${id + '@example.test'}, ${id}, 'test')
      `;
    }
    await db.prisma.$executeRaw`
      INSERT INTO workspaces (id, name, slug, owner_id)
      VALUES (${workspaceId}::uuid, 'Example', 'example', ${ownerId}::uuid)
    `;
    for (const [id, role] of [[adminId, 'admin'], [nullRoleId, null], [legacyOwnerId, 'owner']] as const) {
      await db.prisma.$executeRaw`
        INSERT INTO workspace_members (id, workspace_id, user_id, role)
        VALUES (${randomUUID()}::uuid, ${workspaceId}::uuid, ${id}::uuid, ${role})
      `;
    }
    await db.prisma.$executeRaw`
      INSERT INTO workspace_invitations (id, workspace_id, invited_by, email, token_hash)
      VALUES (${invitationId}::uuid, ${workspaceId}::uuid, ${ownerId}::uuid, 'invite@example.test', 'legacy-hash')
    `;
    const before = await db.prisma.workspaceInvitation.findUniqueOrThrow({ where: { id: invitationId } });

    deployWorkspaceTestDb(db.url);

    const members = await db.prisma.workspaceMember.findMany({
      where: { workspaceId }, select: { userId: true, role: true },
    });
    expect(members.filter(({ userId }) => userId === ownerId)).toEqual([{ userId: ownerId, role: 'member' }]);
    expect(Object.fromEntries(members.map(({ userId, role }) => [userId, role]))).toEqual({
      [ownerId]: 'member', [adminId]: 'admin', [nullRoleId]: 'member', [legacyOwnerId]: 'member',
    });
    expect(await db.prisma.workspaceInvitation.findUniqueOrThrow({ where: { id: invitationId } })).toEqual(before);
    await expect(db.prisma.workspaceMember.create({
      data: { id: randomUUID(), workspaceId, userId: ownerId },
    })).rejects.toMatchObject({ code: 'P2002' });

    const tokenHash = 'a'.repeat(64);
    await db.prisma.$executeRaw`
      INSERT INTO workspace_invite_links (id, workspace_id, invited_by, token_hash, created_at)
      VALUES (${randomUUID()}::uuid, ${workspaceId}::uuid, ${ownerId}::uuid, ${tokenHash}, now())
    `;
    await expect(db.prisma.$executeRaw`
      INSERT INTO workspace_invite_links (id, workspace_id, invited_by, token_hash, created_at)
      VALUES (${randomUUID()}::uuid, ${workspaceId}::uuid, ${ownerId}::uuid, ${tokenHash}, now())
    `).rejects.toMatchObject({ code: 'P2010', meta: { code: '23505' } });
  } finally {
    await db.close();
  }
});
