import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.httpIntegration({
        ignoreIncomingRequestBody: (url) => {
          const path = URL.parse(url, 'http://localhost')?.pathname;
          return (
            path !== undefined && /^\/workspaces\/invitations\/(accept|preview)\/?$/i.test(path)
          );
        },
      }),
    ],
  });
}
