'use client';

import { APP_NAME } from '@/shared/config';
import { useI18n } from '@/shared/i18n';

export function LandingFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:px-6">
        <span className="font-display font-semibold text-foreground">{APP_NAME}</span>
        <span>{t.footer.tagline}</span>
      </div>
    </footer>
  );
}
