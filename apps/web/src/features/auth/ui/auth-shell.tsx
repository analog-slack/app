'use client';

import type { ReactNode } from 'react';

import { LocaleSwitch, useI18n } from '@/shared/i18n';
import { ThemeToggle } from '@/shared/theme';
import { Logo } from '@/shared/ui';

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo label={t.header.home} />
        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-16 sm:pt-20">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
