// Общие zod-схемы, типы и константы для web и api
export const AUTH_ACCESS_COOKIE = 'accessToken';
export const AUTH_REFRESH_COOKIE = 'refreshToken';

export function isAuthRefreshToken(value?: string): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
}
