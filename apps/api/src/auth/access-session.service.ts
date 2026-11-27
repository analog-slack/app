import { AUTH_ACCESS_COOKIE } from '@app/shared';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AuthUserDto } from './auth.dto';
import { AuthService } from './auth.service';

export function readCookie(cookie: string | undefined, name: string) {
  return cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@Injectable()
export class AccessSessionService {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  requireUser(cookie?: string): Promise<AuthUserDto> {
    const token = readCookie(cookie, AUTH_ACCESS_COOKIE);
    if (!token) throw new UnauthorizedException('Access token required');
    return this.auth.profile(token);
  }

  async findUser(cookie?: string): Promise<AuthUserDto | undefined> {
    try {
      return await this.requireUser(cookie);
    } catch (error) {
      if (error instanceof UnauthorizedException) return undefined;
      throw error;
    }
  }

  assertAllowedOrigin(origin?: string): void {
    const allowed = this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
    if (origin !== undefined && origin !== allowed) throw new ForbiddenException();
  }
}
