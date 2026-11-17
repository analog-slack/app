import { describe, expect, it } from 'vitest';

import { getSafeReturnTo, ROUTES } from './routes';

describe('getSafeReturnTo', () => {
  it('keeps a local path with query and fragment', () => {
    expect(getSafeReturnTo('/profile?tab=settings#email')).toBe('/profile?tab=settings#email');
  });

  it.each([
    '//example.com',
    '/\\example.com',
    '/\texample.com',
    'https://example.com',
    '/a/../login',
  ])('uses the profile for an invalid destination (%j)', (destination) => {
    expect(getSafeReturnTo(destination)).toBe(ROUTES.PROFILE);
  });
});
