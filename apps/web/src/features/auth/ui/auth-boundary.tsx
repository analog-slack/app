'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { getApiErrorStatus } from '@/shared/api';
import { getSafeReturnTo, ROUTES, withReturnTo } from '@/shared/config';
import { useI18n } from '@/shared/i18n';

import { useSessionProfile } from '../model/use-auth-session';

export function AuthBoundary({
  mode,
  children,
}: {
  mode: 'guest' | 'protected';
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const profile = useSessionProfile();
  const guest = mode === 'guest';
  const unauthorized = getApiErrorStatus(profile.error) === 401;
  const authenticated = profile.isSuccess;

  useEffect(() => {
    if (guest && authenticated) {
      router.replace(getSafeReturnTo(new URLSearchParams(window.location.search).get('returnTo')));
    } else if (!guest && unauthorized) {
      router.replace(withReturnTo(ROUTES.LOGIN, pathname + window.location.search));
    }
  }, [authenticated, guest, pathname, router, unauthorized]);

  if (guest && !authenticated) return children;
  if (!guest && authenticated) return children;
  if (!guest && profile.isError && !unauthorized) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-destructive">
          {t.auth.errors.unavailable}
        </p>
        <Button variant="outline" onClick={() => void profile.refetch()}>
          {t.auth.retry}
        </Button>
      </div>
    );
  }
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{t.auth.loading}</span>
      <div
        aria-hidden="true"
        className="h-9 w-1/2 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-4 w-3/4 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
      />
    </div>
  );
}
