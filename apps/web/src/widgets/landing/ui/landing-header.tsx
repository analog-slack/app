'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { LocaleSwitch, useI18n } from '@/shared/i18n';
import { ThemeToggle } from '@/shared/theme';
import { Logo } from '@/shared/ui';

export function LandingHeader() {
  const { t } = useI18n();
  const links = [
    { href: '#features', label: t.header.features },
    { href: '#how', label: t.header.how },
    { href: '#faq', label: t.header.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Logo label={t.header.home} />

        <nav
          aria-label={t.header.navLabel}
          className="ml-10 hidden items-center gap-7 text-sm text-muted-foreground md:flex"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitch />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="ml-1">
            <Link href="/login">{t.header.login}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t.header.register}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
