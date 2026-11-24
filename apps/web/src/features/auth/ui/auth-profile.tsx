'use client';

import { useAuthLogout } from '@packages/api';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/shared/config';
import { useI18n } from '@/shared/i18n';

import { useAuthSession, useSessionProfile } from '../model/use-auth-session';

export function AuthProfile() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: user } = useSessionProfile();
  const { clearSession } = useAuthSession();
  const { mutateAsync } = useAuthLogout();
  const [isSigningOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setFailed(false);
    setSigningOut(true);
    try {
      await mutateAsync();
      clearSession();
      router.replace(ROUTES.LOGIN);
    } catch {
      setFailed(true);
      setSigningOut(false);
    }
  }

  if (!user) return null;

  return (
    <section aria-labelledby="profile-title" className="space-y-6">
      <h1 id="profile-title" className="font-display text-3xl font-semibold tracking-tight">
        {t.auth.profile.title}
      </h1>
      <dl className="space-y-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div>
          <dt className="text-sm text-muted-foreground">{t.auth.fields.name}</dt>
          <dd className="wrap-break-word font-medium">{user.username}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{t.auth.fields.email}</dt>
          <dd className="wrap-break-word font-medium">{user.email}</dd>
        </div>
      </dl>
      <Button variant="outline" disabled={isSigningOut} onClick={() => void logout()}>
        {isSigningOut && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {t.auth.profile.logout}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {t.auth.errors.unavailable}
        </p>
      )}
    </section>
  );
}
