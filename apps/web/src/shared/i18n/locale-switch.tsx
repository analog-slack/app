'use client';

import { cn } from '@/shared/lib';

import { useI18n } from './i18n-provider';

export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
      aria-label={t.header.switchLocale}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {t.header.otherLocale}
    </button>
  );
}
