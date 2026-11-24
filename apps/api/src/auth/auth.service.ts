import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { hash, verify } from 'argon2';
import { sign, verify as verifyJwt } from 'jsonwebtoken';
import { z } from 'zod';

import { PrismaService } from '../prisma.service';
import type { AuthUserDto, LoginDto, RegisterDto } from './auth.dto';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_TTL_SECONDS = 15 * 60;
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$3vfcPIqu44gu5eOxbUU3Sw$5gsg9lHy+iYhAYglotdg9wFXKXof+Ko7UTOdHta5FDA';
const ACCESS_CLAIMS = z.object({ sub: z.uuid(), sid: z.uuid() });
const SESSION_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  isActive: true,
} satisfies Prisma.UserSelect;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function publicUser({ id, username, email, avatarUrl }: AuthUserDto): AuthUserDto {
  return { id, username, email, avatarUrl };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register({ email, username, password }: RegisterDto) {
    const id = randomUUID();
    const session = this.prepareSession(id);
    const now = new Date();
    try {
      const user = await this.prisma.user.create({
        data: {
          id,
          email: email.toLowerCase(),
          username,
          passwordHash: await hash(password),
          createdAt: now,
          updatedAt: now,
          authSessions: { create: session.record },
        },
        select: SESSION_USER_SELECT,
      });
      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: publicUser(user),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Account already exists');
      }
      throw error;
    }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = await verify(user?.passwordHash ?? DUMMY_PASSWORD_HASH, password).catch(
      () => false,
    );
    if (!user || user.isActive === false || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = this.prepareSession(user.id);
    await this.prisma.authSession.create({ data: { ...session.record, userId: user.id } });
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: publicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: { select: SESSION_USER_SELECT } },
    });
    if (!session || session.expiresAt.getTime() <= Date.now() || session.user.isActive === false) {
      throw new UnauthorizedException('Session expired');
    }
    return {
      accessToken: this.signAccessToken(session.userId, session.id),
      user: publicUser(session.user),
    };
  }

  async profile(accessToken: string) {
    const secret = this.jwtSecret();
    let payload: unknown;
    try {
      payload = verifyJwt(accessToken, secret, {
        algorithms: ['HS256'],
        audience: 'analog-slack-web',
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
    const claims = ACCESS_CLAIMS.safeParse(payload);
    if (!claims.success) throw new UnauthorizedException('Invalid access token');

    const session = await this.prisma.authSession.findUnique({
      where: { id: claims.data.sid },
      include: { user: { select: SESSION_USER_SELECT } },
    });
    if (
      !session ||
      session.userId !== claims.data.sub ||
      session.expiresAt.getTime() <= Date.now() ||
      session.user.isActive === false
    ) {
      throw new UnauthorizedException('Session expired');
    }
    return publicUser(session.user);
  }

  async logout(refreshToken: string) {
    await this.prisma.authSession.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
  }

  private prepareSession(userId: string) {
    const id = randomUUID();
    const refreshToken = randomBytes(32).toString('base64url');
    return {
      accessToken: this.signAccessToken(userId, id),
      refreshToken,
      record: {
        id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    };
  }

  private signAccessToken(userId: string, sessionId: string) {
    return sign({ sub: userId, sid: sessionId }, this.jwtSecret(), {
      algorithm: 'HS256',
      audience: 'analog-slack-web',
      expiresIn: ACCESS_TTL_SECONDS,
    });
  }

  private jwtSecret() {
    const secret = this.config.get<string>('AUTH_JWT_SECRET');
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new Error('AUTH_JWT_SECRET must be at least 32 bytes');
    }
    return secret;
  }
}
