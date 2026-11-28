import * as Sentry from '@sentry/nestjs';

jest.mock('@sentry/nestjs', () => ({ init: jest.fn(), httpIntegration: jest.fn() }));

it('excludes invitation credentials from Sentry HTTP request body capture', async () => {
  const env = jest.replaceProperty(process, 'env', {
    ...process.env,
    SENTRY_DSN: 'https://public@example.test/1',
  });
  try {
    await import('./instrument');
    expect(Sentry.init).toHaveBeenCalled();
    const ignoreBody = jest.mocked(Sentry.httpIntegration).mock.calls[0]?.[0]
      ?.ignoreIncomingRequestBody;
    const request = { method: 'POST' };
    expect(ignoreBody?.('/workspaces/invitations/accept', request)).toBe(true);
    expect(ignoreBody?.('/workspaces/invitations/preview', request)).toBe(true);
    expect(ignoreBody?.('/WORKSPACES/invitations/accept/?source=app', request)).toBe(true);
    expect(ignoreBody?.('http://example.test/workspaces/invitations/accept', request)).toBe(true);
    expect(ignoreBody?.('/workspaces/123/invitations', request)).toBe(false);
  } finally {
    env.restore();
  }
});
