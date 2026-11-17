import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE, isAuthRefreshToken } from '@app/shared';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';

import { AuthErrorDto, AuthResponseDto, AuthUserDto, LoginDto, RegisterDto } from './auth.dto';
import { ACCESS_TTL_SECONDS, AuthService, SESSION_TTL_MS } from './auth.service';

function readCookie(cookie: string | undefined, name: string) {
  return cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

@ApiTags('auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiUnauthorizedResponse({ type: AuthErrorDto })
  async login(
    @Body() dto: LoginDto,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(origin);
    const { accessToken, refreshToken, user } = await this.auth.login(dto);
    this.setSessionCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('register')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiConflictResponse({ type: AuthErrorDto })
  async register(
    @Body() dto: RegisterDto,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(origin);
    const { accessToken, refreshToken, user } = await this.auth.register(dto);
    this.setSessionCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiCookieAuth(AUTH_REFRESH_COOKIE)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: AuthErrorDto })
  async refresh(
    @Headers('cookie') cookie: string | undefined,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(origin);
    const token = readCookie(cookie, AUTH_REFRESH_COOKIE);
    if (!isAuthRefreshToken(token)) throw new UnauthorizedException('Session expired');
    const { accessToken, user } = await this.auth.refresh(token);
    this.setAccessCookie(res, accessToken);
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiNoContentResponse()
  async logout(
    @Headers('cookie') cookie: string | undefined,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkOrigin(origin);
    const token = readCookie(cookie, AUTH_REFRESH_COOKIE);
    if (isAuthRefreshToken(token)) await this.auth.logout(token);
    res.clearCookie(AUTH_ACCESS_COOKIE, this.cookieOptions());
    res.clearCookie(AUTH_REFRESH_COOKIE, this.cookieOptions());
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @ApiCookieAuth(AUTH_ACCESS_COOKIE)
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({ type: AuthErrorDto })
  profile(@Headers('cookie') cookie?: string) {
    const token = readCookie(cookie, AUTH_ACCESS_COOKIE);
    if (!token) throw new UnauthorizedException('Access token required');
    return this.auth.profile(token);
  }

  private setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
    this.setAccessCookie(res, accessToken);
    res.cookie(AUTH_REFRESH_COOKIE, refreshToken, {
      ...this.cookieOptions(),
      maxAge: SESSION_TTL_MS,
    });
  }

  private setAccessCookie(res: Response, token: string) {
    res.cookie(AUTH_ACCESS_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: ACCESS_TTL_SECONDS * 1000,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }

  private checkOrigin(origin: string | undefined) {
    const allowed = this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
    if (origin !== undefined && origin !== allowed) throw new ForbiddenException();
  }
}
