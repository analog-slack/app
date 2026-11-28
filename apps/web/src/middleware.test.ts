// @vitest-environment node

import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { middleware } from './middleware';

afterEach(() => vi.unstubAllEnvs());

describe('auth middleware', () => {
  it('redirects to login and keeps the protected URL', () => {
    const request = new NextRequest('http://localhost:3000/profile?tab=settings');
    const response = middleware(request);
    const location = new URL(response.headers.get('location') ?? '');

    expect(response.status).toBe(307);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('returnTo')).toBe('/profile?tab=settings');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('preserves the workspace detail route when login is required', () => {
    const request = new NextRequest('http://localhost:3000/profile/workspaces/workspace-id');
    const response = middleware(request);
    const location = new URL(response.headers.get('location') ?? '');

    expect(location.searchParams.get('returnTo')).toBe('/profile/workspaces/workspace-id');
  });

  it('continues to the profile when a session cookie is present', () => {
    const request = new NextRequest('http://localhost:3000/profile', {
      headers: { cookie: `refreshToken=${'a'.repeat(43)}` },
    });

    expect(middleware(request).headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects when the session cookie has an invalid shape', () => {
    const request = new NextRequest('http://localhost:3000/profile', {
      headers: { cookie: 'refreshToken=invalid' },
    });

    expect(middleware(request).status).toBe(307);
  });

  it('rewrites browser auth requests to the configured API', () => {
    vi.stubEnv('AUTH_API_URL', 'http://api:4000/service');
    const request = new NextRequest('http://localhost:3000/api/auth/refresh?source=profile', {
      method: 'POST',
    });

    expect(middleware(request).headers.get('x-middleware-rewrite')).toBe(
      'http://api:4000/service/auth/refresh?source=profile',
    );
  });
});
