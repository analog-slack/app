import { ConfigService } from '@nestjs/config';
import { hash, verify } from 'argon2';

import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = new PrismaService();
  const service = new AuthService(prisma, new ConfigService({ AUTH_JWT_SECRET: 'a'.repeat(64) }));
  const user = {
    id: 'f41c402b-4e63-408e-b792-3c8463cdfc0f',
    email: 'user@example.com',
    username: 'tester',
    avatarUrl: null,
    isActive: true,
    createdAt: null,
    updatedAt: null,
  };

  afterEach(() => jest.restoreAllMocks());

  it('issues separate access and refresh credentials and returns a public profile', async () => {
    const password = 'some-long-password';
    jest
      .spyOn(prisma.user, 'findUnique')
      .mockResolvedValue({ ...user, passwordHash: await hash(password) });
    const session = {
      id: 'aa1c402b-4e63-408e-b792-3c8463cdfc0f',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      user,
    };
    const create = jest.spyOn(prisma.authSession, 'create').mockResolvedValue(session);
    jest.spyOn(prisma.authSession, 'findUnique').mockResolvedValue(session);

    const {
      accessToken,
      refreshToken,
      user: profile,
    } = await service.login({ email: user.email, password });

    expect(profile).toEqual({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: null,
    });
    expect(create.mock.calls[0]?.[0].data.tokenHash).not.toBe(refreshToken);
    await expect(service.profile(accessToken)).resolves.toEqual(profile);
    await expect(service.profile(refreshToken)).rejects.toMatchObject({ status: 401 });
  });

  it('rejects expired sessions during refresh', async () => {
    const session = {
      id: 'session',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(0),
      user,
    };
    jest.spyOn(prisma.authSession, 'findUnique').mockResolvedValue(session);

    await expect(service.refresh('refresh-token')).rejects.toMatchObject({ status: 401 });
  });

  it('creates a user and session together with hashed credentials', async () => {
    const create = jest
      .spyOn(prisma.user, 'create')
      .mockResolvedValue({ ...user, passwordHash: 'unused' });
    const password = 'test-password';
    const result = await service.register({
      email: 'User@Example.com',
      username: 'tester',
      password,
    });
    const data = create.mock.calls[0]?.[0].data;

    expect(data?.email).toBe('user@example.com');
    expect(data?.authSessions?.create).toMatchObject({
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(data?.passwordHash).toBeDefined();
    await expect(verify(data?.passwordHash ?? '', password)).resolves.toBe(true);
    expect(result).not.toHaveProperty('user.passwordHash');
  });

  it('revokes the session that matches the refresh cookie', async () => {
    const password = 'test-password';
    jest
      .spyOn(prisma.user, 'findUnique')
      .mockResolvedValue({ ...user, passwordHash: await hash(password) });
    const session = {
      id: 'aa1c402b-4e63-408e-b792-3c8463cdfc0f',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(),
      user,
    };
    const create = jest.spyOn(prisma.authSession, 'create').mockResolvedValue(session);
    const revoke = jest.spyOn(prisma.authSession, 'deleteMany').mockResolvedValue({ count: 1 });
    const { refreshToken } = await service.login({ email: user.email, password });

    await service.logout(refreshToken);

    const tokenHash = create.mock.calls[0]?.[0].data.tokenHash;
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(revoke).toHaveBeenCalledWith({ where: { tokenHash } });
  });
});
